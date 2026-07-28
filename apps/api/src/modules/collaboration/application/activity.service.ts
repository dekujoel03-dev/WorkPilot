import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { ActivityAction, EntityType, Prisma } from '@prisma/client';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    workspaceId: string;
    userId: string;
    entityType: EntityType;
    entityId: string;
    action: ActivityAction;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.activity.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  async findByWorkspace(workspaceId: string, limit = 30) {
    const activities = await this.prisma.activity.findMany({
      where: { workspaceId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { data: activities };
  }

  async findByTask(workspaceId: string, taskId: string, limit = 30) {
    const activities = await this.prisma.activity.findMany({
      where: { workspaceId, entityId: taskId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { data: activities };
  }
}
