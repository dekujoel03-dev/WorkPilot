import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { TaskPriority } from '@prisma/client';

@Injectable()
export class WorkloadService {
  constructor(private readonly prisma: PrismaService) {}

  /** Minutes de travail estimé pour une date donnée (tâches assignées à l'utilisateur). */
  async getDailyWorkloadMinutes(
    userId: string,
    workspaceId: string,
    date: Date,
  ): Promise<number> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        parentId: null,
        completedAt: null,
        dueDate: { gte: start, lte: end },
        assignees: { some: { userId } },
      },
      select: { estimatedTime: true },
    });

    if (tasks.length === 0) {
      const fallback = await this.prisma.task.findMany({
        where: {
          workspaceId,
          parentId: null,
          completedAt: null,
          dueDate: { gte: start, lte: end },
        },
        select: { estimatedTime: true },
      });
      return fallback.reduce((sum, t) => sum + (t.estimatedTime ?? 60), 0);
    }

    return tasks.reduce((sum, t) => sum + (t.estimatedTime ?? 60), 0);
  }

  async getMaxDailyHours(userId: string): Promise<number> {
    const prefs = await this.prisma.reminderPreference.findUnique({
      where: { userId },
    });
    return prefs?.maxDailyHours ?? 8;
  }

  isOverloaded(workloadMinutes: number, maxHours: number): boolean {
    return workloadMinutes >= maxHours * 60;
  }

  priorityScore(priority: TaskPriority): number {
    const scores: Record<TaskPriority, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      NONE: 0,
    };
    return scores[priority];
  }
}
