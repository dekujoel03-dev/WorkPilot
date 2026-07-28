import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { calculateProjectProgress } from '@work-pilot/shared';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import {
  EVENT_BUS,
  type IEventBus,
} from '../../../infrastructure/events/events.module';
import {
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
} from '../presentation/dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async findByProject(workspaceId: string, projectId: string, userId: string) {
    await this.access.ensureProjectAccess(workspaceId, projectId, userId);

    const tasks = await this.prisma.task.findMany({
      where: { workspaceId, projectId, parentId: null },
      include: {
        status: true,
        _count: { select: { subtasks: true, comments: true } },
      },
      orderBy: [{ listId: 'asc' }, { position: 'asc' }],
    });

    return { data: tasks };
  }

  async findOne(workspaceId: string, taskId: string, userId: string) {
    await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const task = await this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: {
        status: true,
        checklist: { orderBy: { position: 'asc' } },
        _count: { select: { subtasks: true, comments: true } },
      },
    });

    return { data: task };
  }

  async create(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: CreateTaskDto,
  ) {
    await this.access.ensureCanEditTasks(workspaceId, projectId, userId);

    let listId = dto.listId;
    if (!listId) {
      const firstList = await this.prisma.projectList.findFirst({
        where: { projectId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      listId = firstList?.id;
    }

    if (listId) {
      const list = await this.prisma.projectList.findFirst({
        where: { id: listId, projectId },
      });
      if (!list) throw new NotFoundException('Liste introuvable');
    }

    const maxPosition = listId
      ? await this.prisma.task.aggregate({
          where: { projectId, listId },
          _max: { position: true },
        })
      : { _max: { position: 0 as number | null } };

    let task = await this.prisma.task.create({
      data: {
        workspaceId,
        projectId,
        title: dto.title,
        description: dto.description,
        listId,
        statusId: dto.statusId,
        priority: dto.priority ?? 'NONE',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedTime: dto.estimatedTime,
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: { status: true },
    });

    if (listId && !dto.statusId) {
      const statusSync = await this.syncTaskStatusFromList(
        projectId,
        listId,
        workspaceId,
      );
      if (statusSync.statusId) {
        task = await this.prisma.task.update({
          where: { id: task.id },
          data: {
            statusId: statusSync.statusId,
            completedAt: statusSync.completedAt,
          },
          include: { status: true },
        });
      }
    }

    await this.updateProjectProgress(projectId);

    return { data: task };
  }

  async update(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    const task = await this.access.ensureTaskAccess(
      workspaceId,
      taskId,
      userId,
    );
    await this.access.ensureCanEditTasks(workspaceId, task.projectId, userId);

    const { dueDate, statusId, ...rest } = dto;

    const updateData: Record<string, unknown> = { ...rest };

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate === null ? null : new Date(dueDate);
    }

    if (statusId !== undefined) {
      updateData.statusId = statusId;
      if (statusId) {
        const listSync = await this.syncListFromStatus(
          task.projectId,
          statusId,
          workspaceId,
        );
        if (listSync.listId && listSync.listId !== task.listId) {
          updateData.listId = listSync.listId;
          const maxPosition = await this.prisma.task.aggregate({
            where: {
              projectId: task.projectId,
              listId: listSync.listId,
              id: { not: taskId },
            },
            _max: { position: true },
          });
          updateData.position = (maxPosition._max.position ?? -1) + 1;
        }
        updateData.completedAt = listSync.completedAt ?? null;
      } else {
        updateData.completedAt = null;
      }
    }

    const previousListId = task.listId;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { status: true },
    });

    const newListId = updated.listId;
    if (
      previousListId &&
      newListId &&
      previousListId !== newListId
    ) {
      const oldListTasks = await this.prisma.task.findMany({
        where: {
          projectId: task.projectId,
          listId: previousListId,
          id: { not: taskId },
        },
        orderBy: { position: 'asc' },
        select: { id: true },
      });

      for (let i = 0; i < oldListTasks.length; i++) {
        await this.prisma.task.update({
          where: { id: oldListTasks[i].id },
          data: { position: i },
        });
      }
    }

    await this.updateProjectProgress(task.projectId);

    await this.publishTaskUpdated(workspaceId, userId, updated);

    return { data: updated };
  }

  async move(
    workspaceId: string,
    taskId: string,
    userId: string,
    dto: MoveTaskDto,
  ) {
    const task = await this.access.ensureTaskAccess(
      workspaceId,
      taskId,
      userId,
    );
    await this.access.ensureCanEditTasks(workspaceId, task.projectId, userId);

    const list = await this.prisma.projectList.findFirst({
      where: { id: dto.listId, projectId: task.projectId },
    });

    if (!list) throw new NotFoundException('Liste introuvable');

    await this.prisma.$transaction(async (tx) => {
      const targetTasks = await tx.task.findMany({
        where: {
          projectId: task.projectId,
          listId: dto.listId,
          id: { not: taskId },
        },
        orderBy: { position: 'asc' },
        select: { id: true },
      });

      const orderedIds = targetTasks.map((t) => t.id);
      orderedIds.splice(dto.position, 0, taskId);

      await tx.task.update({
        where: { id: taskId },
        data: {
          listId: dto.listId,
          ...(await this.syncTaskStatusFromList(
            task.projectId,
            dto.listId,
            workspaceId,
          )),
        },
      });

      for (let i = 0; i < orderedIds.length; i++) {
        await tx.task.update({
          where: { id: orderedIds[i] },
          data: { position: i },
        });
      }

      if (task.listId && task.listId !== dto.listId) {
        const oldListTasks = await tx.task.findMany({
          where: {
            projectId: task.projectId,
            listId: task.listId,
            id: { not: taskId },
          },
          orderBy: { position: 'asc' },
          select: { id: true },
        });

        for (let i = 0; i < oldListTasks.length; i++) {
          await tx.task.update({
            where: { id: oldListTasks[i].id },
            data: { position: i },
          });
        }
      }
    });

    const moved = await this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: { status: true },
    });

    await this.updateProjectProgress(task.projectId);

    await this.publishTaskUpdated(workspaceId, userId, moved);

    return { data: moved };
  }

  async remove(workspaceId: string, taskId: string, userId: string) {
    const task = await this.access.ensureTaskAccess(
      workspaceId,
      taskId,
      userId,
    );
    await this.access.ensureCanEditTasks(workspaceId, task.projectId, userId);

    await this.prisma.task.delete({ where: { id: taskId } });
    await this.updateProjectProgress(task.projectId);

    return { data: { success: true } };
  }

  async toggleChecklistItem(
    workspaceId: string,
    taskId: string,
    itemId: string,
    userId: string,
  ) {
    await this.access.ensureTaskAccess(workspaceId, taskId, userId);

    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, taskId },
    });
    if (!item) throw new NotFoundException('Élément introuvable');

    const updated = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: { completed: !item.completed },
    });

    return { data: updated };
  }

  private async publishTaskUpdated(
    workspaceId: string,
    userId: string,
    task: {
      id: string;
      projectId: string;
      title: string;
      listId: string | null;
      statusId: string | null;
      priority: string;
      dueDate: Date | null;
      completedAt: Date | null;
    },
  ) {
    await this.eventBus.publish({
      type: 'task.updated',
      payload: {
        workspaceId,
        userId,
        entityType: 'TASK',
        entityId: task.id,
        projectId: task.projectId,
        title: task.title,
        listId: task.listId,
        statusId: task.statusId,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString() ?? null,
        completedAt: task.completedAt?.toISOString() ?? null,
      },
      occurredAt: new Date(),
    });
  }

  private async syncListFromStatus(
    projectId: string,
    statusId: string,
    workspaceId: string,
  ): Promise<{ listId?: string; completedAt?: Date | null }> {
    const [lists, statuses] = await Promise.all([
      this.prisma.projectList.findMany({
        where: { projectId },
        orderBy: { position: 'asc' },
        select: { id: true },
      }),
      this.prisma.taskStatus.findMany({
        where: { workspaceId },
        orderBy: { position: 'asc' },
      }),
    ]);

    const statusIndex = statuses.findIndex((s) => s.id === statusId);
    if (statusIndex === -1 || lists.length === 0) return {};

    const list = lists[Math.min(statusIndex, lists.length - 1)];
    const status = statuses[statusIndex];
    return {
      listId: list.id,
      completedAt: status.isDone ? new Date() : null,
    };
  }

  private async syncTaskStatusFromList(
    projectId: string,
    listId: string,
    workspaceId: string,
  ): Promise<{ statusId?: string; completedAt?: Date | null }> {
    const [lists, statuses] = await Promise.all([
      this.prisma.projectList.findMany({
        where: { projectId },
        orderBy: { position: 'asc' },
        select: { id: true },
      }),
      this.prisma.taskStatus.findMany({
        where: { workspaceId },
        orderBy: { position: 'asc' },
      }),
    ]);

    const listIndex = lists.findIndex((l) => l.id === listId);
    if (listIndex === -1 || statuses.length === 0) return {};

    const status = statuses[Math.min(listIndex, statuses.length - 1)];
    return {
      statusId: status.id,
      completedAt: status.isDone ? new Date() : null,
    };
  }

  private async updateProjectProgress(projectId: string) {
    const lists = await this.prisma.projectList.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    const lastListId = lists.at(-1)?.id;

    const [total, done] = await Promise.all([
      this.prisma.task.count({ where: { projectId, parentId: null } }),
      this.prisma.task.count({
        where: {
          projectId,
          parentId: null,
          OR: [
            { status: { isDone: true } },
            ...(lastListId ? [{ listId: lastListId }] : []),
          ],
        },
      }),
    ]);

    const progress = calculateProjectProgress(total, done);

    await this.prisma.project.update({
      where: { id: projectId },
      data: { progress },
    });
  }
}
