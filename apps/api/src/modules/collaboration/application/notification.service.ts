import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { NotificationType, Prisma } from '@prisma/client';
import { EventsGateway } from '../../../infrastructure/websocket/events.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: EventsGateway,
  ) {}

  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: (params.data ?? {}) as Prisma.InputJsonValue,
        channel: 'IN_APP',
      },
    });

    this.gateway.emitToUser(params.userId, 'notification.new', {
      notification,
    });

    return notification;
  }

  async findByUser(userId: string, limit = 30) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { data: notifications };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { data: { count } };
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    return { data: { success: true } };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { data: { success: true } };
  }

  async notifyTaskWatchers(params: {
    taskId: string;
    workspaceId: string;
    excludeUserId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const watchers = await this.prisma.taskWatcher.findMany({
      where: { taskId: params.taskId, userId: { not: params.excludeUserId } },
      select: { userId: true },
    });

    const assignees = await this.prisma.taskAssignee.findMany({
      where: { taskId: params.taskId, userId: { not: params.excludeUserId } },
      select: { userId: true },
    });

    const userIds = [
      ...new Set([...watchers, ...assignees].map((w) => w.userId)),
    ];

    for (const userId of userIds) {
      await this.create({
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: {
          ...params.data,
          taskId: params.taskId,
          workspaceId: params.workspaceId,
        },
      });
    }
  }
}
