import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { NotificationService } from '../../collaboration/application/notification.service';

const REMINDER_LEAD_MS = 10 * 60 * 1000;
const TICK_MS = 60 * 1000;

function isMeetingLink(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function formatLocationForReminder(location: string) {
  const trimmed = location.trim();
  if (isMeetingLink(trimmed)) {
    try {
      const url = new URL(trimmed);
      return {
        type: 'online' as const,
        label: url.hostname.replace(/^www\./, ''),
        url: trimmed,
      };
    } catch {
      return { type: 'online' as const, label: trimmed, url: trimmed };
    }
  }
  return { type: 'physical' as const, label: trimmed, url: null };
}

function minutesUntilStart(startTime: Date, now: Date) {
  return Math.max(1, Math.ceil((startTime.getTime() - now.getTime()) / 60_000));
}

function buildReminderTitle(startTime: Date, now: Date) {
  const minutes = minutesUntilStart(startTime, now);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `Réunion dans ${hours} h`;
    return `Réunion dans ${hours} h ${remainder} min`;
  }
  return minutes === 1 ? 'Réunion dans 1 minute' : `Réunion dans ${minutes} minutes`;
}

function buildMeetingReminderBody(
  title: string,
  minutesUntil: number,
  location: string | null,
) {
  const delay =
    minutesUntil >= 60
      ? `dans ${Math.floor(minutesUntil / 60)} h${minutesUntil % 60 ? ` ${minutesUntil % 60} min` : ''}`
      : minutesUntil === 1
        ? 'dans 1 minute'
        : `dans ${minutesUntil} minutes`;

  let body = `« ${title} » ${delay}.`;
  if (!location?.trim()) return body;

  const formatted = formatLocationForReminder(location);
  if (formatted.type === 'online') {
    body += ` Lien visio : ${formatted.label}`;
  } else {
    body += ` Lieu : ${formatted.label}`;
  }
  return body;
}

@Injectable()
export class MeetingReminderService implements OnModuleInit {
  private readonly logger = new Logger(MeetingReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  onModuleInit() {
    void this.processDueReminders();
    setInterval(() => void this.processDueReminders(), TICK_MS);
  }

  async processDueReminders() {
    const now = new Date();

    const meetings = await this.prisma.meeting.findMany({
      where: {
        reminderSentAt: null,
        startTime: { gt: now },
      },
    });

    const dueMeetings = meetings.filter((meeting) => {
      const remindAt = new Date(meeting.startTime.getTime() - REMINDER_LEAD_MS);
      return now >= remindAt;
    });

    for (const meeting of dueMeetings) {
      try {
        await this.sendMeetingReminder(meeting, now);
      } catch (error) {
        this.logger.error(
          `Failed to send meeting reminder for ${meeting.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  async trySendDueReminder(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting || meeting.reminderSentAt) return;

    const now = new Date();
    if (meeting.startTime <= now) return;

    const remindAt = new Date(meeting.startTime.getTime() - REMINDER_LEAD_MS);
    if (now >= remindAt) {
      await this.sendMeetingReminder(meeting, now);
    }
  }

  private async sendMeetingReminder(
    meeting: {
      id: string;
      workspaceId: string;
      title: string;
      startTime: Date;
      location: string | null;
    },
    now: Date,
  ) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId: meeting.workspaceId },
      select: { userId: true },
    });

    if (members.length === 0) return;

    const minutesUntil = minutesUntilStart(meeting.startTime, now);
    const locationInfo = meeting.location?.trim()
      ? formatLocationForReminder(meeting.location)
      : null;

    const updated = await this.prisma.meeting.updateMany({
      where: { id: meeting.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });

    if (updated.count === 0) return;

    for (const member of members) {
      await this.notifications.create({
        userId: member.userId,
        type: 'MEETING_REMINDER',
        title: buildReminderTitle(meeting.startTime, now),
        body: buildMeetingReminderBody(meeting.title, minutesUntil, meeting.location),
        data: {
          meetingId: meeting.id,
          workspaceId: meeting.workspaceId,
          meetingTitle: meeting.title,
          startTime: meeting.startTime.toISOString(),
          location: meeting.location,
          locationType: locationInfo?.type ?? null,
          meetingUrl: locationInfo?.url ?? null,
        },
      });
    }
  }
}
