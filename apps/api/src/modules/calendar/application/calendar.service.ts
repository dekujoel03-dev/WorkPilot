import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { CreateMeetingDto } from '../presentation/dto/create-meeting.dto';
import { UpdateMeetingDto } from '../presentation/dto/update-meeting.dto';
import { MeetingReminderService } from './meeting-reminder.service';
import { NotificationService } from '../../collaboration/application/notification.service';

function mapMeetingItem(
  meeting: {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date;
    location: string | null;
  },
  now: Date,
) {
  const status = meeting.endTime < now ? 'completed' : 'upcoming';
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    startTime: meeting.startTime.toISOString(),
    endTime: meeting.endTime.toISOString(),
    location: meeting.location,
    status,
  } as const;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly meetingReminders: MeetingReminderService,
    private readonly notifications: NotificationService,
  ) {}

  async getEvents(
    workspaceId: string,
    userId: string,
    from: string,
    to: string,
  ) {
    await this.access.ensureMember(workspaceId, userId);
    const accessible = await this.access.listAccessibleProjectIds(workspaceId, userId);
    const taskScope = this.access.projectScopeFilter(accessible);

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const now = new Date();

    const [tasks, meetings] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          workspaceId,
          parentId: null,
          ...taskScope,
          dueDate: { gte: fromDate, lte: toDate },
        },
        include: { project: { select: { name: true, color: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.meeting.findMany({
        where: {
          workspaceId,
          OR: [
            { startTime: { gte: fromDate, lte: toDate } },
            { endTime: { gte: fromDate, lte: toDate } },
          ],
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const events = [
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task' as const,
        title: t.title,
        start: t.dueDate!.toISOString(),
        end: t.dueDate!.toISOString(),
        color: t.project.color,
        projectName: t.project.name,
        projectId: t.projectId,
        allDay: true,
      })),
      ...meetings.map((m) => ({
        id: m.id,
        type: 'meeting' as const,
        title: m.title,
        start: m.startTime.toISOString(),
        end: m.endTime.toISOString(),
        color: '#6366F1',
        allDay: false,
        status: m.endTime < now ? ('completed' as const) : ('upcoming' as const),
      })),
    ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return { data: events };
  }

  async listUpcomingMeetings(workspaceId: string, userId: string) {
    await this.access.ensureMember(workspaceId, userId);
    const now = new Date();

    const meetings = await this.prisma.meeting.findMany({
      where: { workspaceId, endTime: { gte: now } },
      orderBy: { startTime: 'asc' },
    });

    return {
      data: meetings.map((m) => mapMeetingItem(m, now)),
    };
  }

  async listArchivedMeetings(workspaceId: string, userId: string) {
    await this.access.ensureMember(workspaceId, userId);
    const now = new Date();

    const meetings = await this.prisma.meeting.findMany({
      where: { workspaceId, endTime: { lt: now } },
      orderBy: { startTime: 'desc' },
    });

    return {
      data: meetings.map((m) => mapMeetingItem(m, now)),
    };
  }

  async createMeeting(
    workspaceId: string,
    userId: string,
    dto: CreateMeetingDto,
  ) {
    await this.access.ensureMember(workspaceId, userId);

    const meeting = await this.prisma.meeting.create({
      data: {
        workspaceId,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        location: dto.location,
      },
    });

    await this.meetingReminders.trySendDueReminder(meeting.id);

    return { data: meeting };
  }

  private async findMeetingOrThrow(workspaceId: string, meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, workspaceId },
    });
    if (!meeting) {
      throw new NotFoundException('Réunion introuvable');
    }
    return meeting;
  }

  async updateMeeting(
    workspaceId: string,
    userId: string,
    meetingId: string,
    dto: UpdateMeetingDto,
  ) {
    await this.access.ensureMember(workspaceId, userId);
    const existing = await this.findMeetingOrThrow(workspaceId, meetingId);

    const startTime = dto.startTime ? new Date(dto.startTime) : existing.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;

    if (endTime <= startTime) {
      throw new BadRequestException('La fin doit être postérieure au début');
    }

    const startChanged =
      dto.startTime !== undefined &&
      startTime.getTime() !== existing.startTime.getTime();

    if (startChanged) {
      await this.notifications.clearMeetingReminders(meetingId);
    }

    const meeting = await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startTime !== undefined && { startTime }),
        ...(dto.endTime !== undefined && { endTime }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(startChanged && { reminderSentAt: null }),
      },
    });

    await this.meetingReminders.trySendDueReminder(meeting.id);

    const now = new Date();
    return { data: mapMeetingItem(meeting, now) };
  }

  async deleteMeeting(
    workspaceId: string,
    userId: string,
    meetingId: string,
  ) {
    await this.access.ensureMember(workspaceId, userId);
    await this.findMeetingOrThrow(workspaceId, meetingId);
    await this.notifications.clearMeetingReminders(meetingId);

    await this.prisma.meeting.delete({ where: { id: meetingId } });

    return { data: { id: meetingId } };
  }
}
