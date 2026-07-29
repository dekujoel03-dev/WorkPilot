import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import type { ActivityAction, EntityType, Prisma } from '@prisma/client';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

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

  async findByWorkspace(workspaceId: string, userId: string, limit = 30) {
    const accessible = await this.access.listAccessibleProjectIds(workspaceId, userId);

    const activities = await this.prisma.activity.findMany({
      where: { workspaceId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: accessible === 'all' ? limit : limit * 3,
    });

    if (accessible === 'all') {
      return { data: activities };
    }

    const projectIds = new Set(accessible);
    const tasks = await this.prisma.task.findMany({
      where: { workspaceId, projectId: { in: accessible } },
      select: { id: true },
    });
    const taskIds = new Set(tasks.map((t) => t.id));

    const filtered = activities.filter((activity) => {
      const meta = activity.metadata as Record<string, unknown> | null;

      switch (activity.entityType) {
        case 'PROJECT':
          return projectIds.has(activity.entityId);
        case 'TASK':
          return taskIds.has(activity.entityId);
        case 'COMMENT':
          return taskIds.has(activity.entityId);
        case 'ATTACHMENT':
          if (meta?.meetingId) return true;
          if (meta?.taskId && typeof meta.taskId === 'string') {
            return taskIds.has(meta.taskId);
          }
          return taskIds.has(activity.entityId);
        case 'DOCUMENT':
          return projectIds.has(activity.entityId);
        default:
          return false;
      }
    });

    return { data: filtered.slice(0, limit) };
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
