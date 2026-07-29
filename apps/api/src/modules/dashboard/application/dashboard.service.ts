import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { WorkloadService } from '../../intelligence/application/workload.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly workload: WorkloadService,
  ) {}

  async getStats(workspaceId: string, userId: string) {
    await this.access.ensureMember(workspaceId, userId);
    const accessible = await this.access.listAccessibleProjectIds(workspaceId, userId);
    const projectScope = this.access.projectIdScopeFilter(accessible);
    const taskScope = this.access.projectScopeFilter(accessible);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [
      projects,
      totalTasks,
      completedTasks,
      overdueTasks,
      timeAgg,
      maxHours,
      workloadMinutes,
    ] = await Promise.all([
      this.prisma.project.findMany({
        where: { workspaceId, archived: false, ...projectScope },
        select: { progress: true },
      }),
      this.prisma.task.count({ where: { workspaceId, parentId: null, ...taskScope } }),
      this.prisma.task.count({
        where: { workspaceId, parentId: null, ...taskScope, completedAt: { not: null } },
      }),
      this.prisma.task.count({
        where: {
          workspaceId,
          parentId: null,
          ...taskScope,
          completedAt: null,
          dueDate: { lt: todayStart },
        },
      }),
      this.prisma.task.aggregate({
        where: { workspaceId, parentId: null, ...taskScope },
        _sum: { actualTime: true },
      }),
      this.workload.getMaxDailyHours(userId),
      this.workload.getDailyWorkloadMinutes(userId, workspaceId, now),
    ]);

    const avgProgress =
      projects.length > 0
        ? Math.round(
            projects.reduce((s, p) => s + p.progress, 0) / projects.length,
          )
        : 0;

    const timeWorkedMinutes = timeAgg._sum.actualTime ?? 0;

    return {
      data: {
        activeProjects: projects.length,
        totalTasks,
        completedTasks,
        overdueTasks,
        timeWorkedMinutes,
        timeWorkedHours: Math.round((timeWorkedMinutes / 60) * 10) / 10,
        avgProgress,
        workloadPercent: Math.min(
          100,
          Math.round((workloadMinutes / (maxHours * 60)) * 100),
        ),
      },
    };
  }
}
