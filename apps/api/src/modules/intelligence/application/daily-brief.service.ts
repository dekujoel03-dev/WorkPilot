import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { WorkloadService } from './workload.service';

@Injectable()
export class DailyBriefService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly workload: WorkloadService,
  ) {}

  async getBrief(workspaceId: string, userId: string) {
    await this.access.ensureMember(workspaceId, userId);
    const accessible = await this.access.listAccessibleProjectIds(workspaceId, userId);
    const taskScope = this.access.projectScopeFilter(accessible);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { firstName: true, timezone: true },
    });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const hour = now.getHours();
    const greeting =
      hour < 12
        ? `Bonjour ${user.firstName}`
        : hour < 18
          ? `Bon après-midi ${user.firstName}`
          : `Bonsoir ${user.firstName}`;

    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        parentId: null,
        ...taskScope,
        completedAt: null,
        OR: [{ assignees: { some: { userId } } }, { assignees: { none: {} } }],
      },
      include: {
        project: { select: { name: true } },
        assignees: true,
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    const userTasks = tasks.filter(
      (t) =>
        t.assignees.length === 0 ||
        t.assignees.some((a) => a.userId === userId),
    );

    const mapTask = (t: (typeof userTasks)[0]) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      estimatedTime: t.estimatedTime,
      projectId: t.projectId,
      projectName: t.project.name,
    });

    const overdue = userTasks
      .filter((t) => t.dueDate && t.dueDate < todayStart)
      .map(mapTask);

    const dueToday = userTasks.filter(
      (t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd,
    );

    const focusTasks = [...dueToday, ...userTasks.filter((t) => t.dueDate && t.dueDate < todayStart)];

    const criticalTasks = focusTasks
      .filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH')
      .map(mapTask);

    const meetings = await this.prisma.meeting.findMany({
      where: {
        workspaceId,
        endTime: { gte: now },
        startTime: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { startTime: 'asc' },
    });

    const workloadMinutes = focusTasks.reduce(
      (sum, t) => sum + (t.estimatedTime ?? 60),
      0,
    );
    const maxDailyHours = await this.workload.getMaxDailyHours(userId);

    const mainGoalCandidate = [...focusTasks]
      .sort(
        (a, b) =>
          this.workload.priorityScore(b.priority) -
          this.workload.priorityScore(a.priority),
      )[0];

    return {
      data: {
        greeting,
        date: now.toISOString().split('T')[0],
        criticalTasks,
        meetings: meetings.map((m) => ({
          id: m.id,
          title: m.title,
          startTime: m.startTime.toISOString(),
          endTime: m.endTime.toISOString(),
          location: m.location,
        })),
        overdue,
        estimatedMinutes: workloadMinutes,
        estimatedHours: Math.round((workloadMinutes / 60) * 10) / 10,
        mainGoal: mainGoalCandidate ? mapTask(mainGoalCandidate) : null,
        workloadPercent: Math.min(
          100,
          Math.round((workloadMinutes / (maxDailyHours * 60)) * 100),
        ),
        maxDailyHours,
      },
    };
  }
}
