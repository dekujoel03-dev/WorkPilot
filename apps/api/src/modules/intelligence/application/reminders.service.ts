import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { WorkloadService } from './workload.service';
import { NotificationService } from '../../collaboration/application/notification.service';
import { MeetingReminderService } from '../../calendar/application/meeting-reminder.service';

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly workload: WorkloadService,
    private readonly notifications: NotificationService,
    private readonly meetingReminders: MeetingReminderService,
  ) {}

  /** Analyse les tâches à venir et génère des rappels intelligents. */
  async syncSmartReminders(workspaceId: string, userId: string) {
    await this.access.ensureMember(workspaceId, userId);
    await this.meetingReminders.processDueReminders();

    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const todayWorkload = await this.workload.getDailyWorkloadMinutes(
      userId,
      workspaceId,
      now,
    );
    const maxHours = await this.workload.getMaxDailyHours(userId);
    const overloaded = this.workload.isOverloaded(todayWorkload, maxHours);

    const upcomingTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        parentId: null,
        completedAt: null,
        dueDate: { gte: tomorrowStart, lte: tomorrowEnd },
        OR: [{ assignees: { some: { userId } } }, { assignees: { none: {} } }],
      },
      include: { assignees: true },
    });

    const relevant = upcomingTasks.filter(
      (t) =>
        t.assignees.length === 0 ||
        t.assignees.some((a) => a.userId === userId),
    );

    for (const task of relevant) {
      const existing = await this.prisma.reminder.findFirst({
        where: { taskId: task.id, userId, status: 'PENDING' },
      });

      if (existing) continue;

      const suggestion = overloaded ? 'AUTO_RESCHEDULE' : 'START_NOW';
      const message = overloaded
        ? `« ${task.title} » est prévue demain, mais vous avez déjà ${Math.round(todayWorkload / 60)}h de travail aujourd'hui.`
        : `« ${task.title} » est prévue demain — bon moment pour avancer.`;

      await this.prisma.reminder.create({
        data: {
          taskId: task.id,
          userId,
          scheduledAt: now,
          suggestion,
          channels: ['IN_APP'],
        },
      });

      await this.notifications.create({
        userId,
        type: 'REMINDER',
        title: 'Rappel intelligent',
        body: message,
        data: { taskId: task.id, suggestion, workspaceId },
      });
    }

    return this.listPending(workspaceId, userId);
  }

  async listPending(workspaceId: string, userId: string) {
    await this.access.ensureMember(workspaceId, userId);

    const now = new Date();
    const todayWorkload = await this.workload.getDailyWorkloadMinutes(
      userId,
      workspaceId,
      now,
    );
    const maxHours = await this.workload.getMaxDailyHours(userId);

    const reminders = await this.prisma.reminder.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        task: { select: { id: true, title: true, workspaceId: true, projectId: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const filtered = reminders.filter(
      (r) => r.task.workspaceId === workspaceId,
    );

    return {
      data: filtered.map((r) => ({
        id: r.id,
        taskId: r.taskId,
        taskTitle: r.task.title,
        projectId: r.task.projectId,
        scheduledAt: r.scheduledAt.toISOString(),
        status: r.status,
        suggestion:
          (r.suggestion as 'START_NOW' | 'AUTO_RESCHEDULE' | null) ?? 'NONE',
        message:
          r.suggestion === 'AUTO_RESCHEDULE'
            ? `Charge élevée aujourd'hui (${Math.round(todayWorkload / 60)}h/${maxHours}h) — décaler « ${r.task.title} » ?`
            : `Commencer « ${r.task.title} » maintenant ?`,
        todayWorkloadHours: Math.round((todayWorkload / 60) * 10) / 10,
        maxDailyHours: maxHours,
      })),
    };
  }

  async handleAction(
    workspaceId: string,
    userId: string,
    reminderId: string,
    action: 'START_NOW' | 'AUTO_RESCHEDULE' | 'DISMISS' | 'SNOOZE',
  ) {
    await this.access.ensureMember(workspaceId, userId);

    const reminder = await this.prisma.reminder.findFirst({
      where: { id: reminderId, userId },
      include: { task: true },
    });

    if (!reminder) throw new NotFoundException('Rappel introuvable');
    if (reminder.task.workspaceId !== workspaceId)
      throw new BadRequestException('Rappel invalide');

    switch (action) {
      case 'START_NOW': {
        await this.prisma.reminder.update({
          where: { id: reminderId },
          data: { status: 'SENT', sentAt: new Date() },
        });
        return {
          data: {
            action,
            taskId: reminder.taskId,
            projectId: reminder.task.projectId,
          },
        };
      }
      case 'AUTO_RESCHEDULE': {
        const newDue = reminder.task.dueDate
          ? new Date(reminder.task.dueDate)
          : new Date();
        newDue.setDate(newDue.getDate() + 1);
        await this.prisma.task.update({
          where: { id: reminder.taskId },
          data: { dueDate: newDue },
        });
        await this.prisma.reminder.update({
          where: { id: reminderId },
          data: { status: 'AUTO_RESCHEDULED', sentAt: new Date() },
        });
        return { data: { action, newDueDate: newDue.toISOString() } };
      }
      case 'DISMISS':
        await this.prisma.reminder.update({
          where: { id: reminderId },
          data: { status: 'DISMISSED', sentAt: new Date() },
        });
        return { data: { action } };
      case 'SNOOZE': {
        const snoozeUntil = new Date();
        snoozeUntil.setHours(snoozeUntil.getHours() + 2);
        await this.prisma.reminder.update({
          where: { id: reminderId },
          data: { status: 'PENDING', scheduledAt: snoozeUntil },
        });
        return { data: { action, snoozeUntil: snoozeUntil.toISOString() } };
      }
      default:
        throw new BadRequestException('Action invalide');
    }
  }
}
