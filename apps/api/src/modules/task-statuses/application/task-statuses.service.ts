import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import {
  CreateTaskStatusDto,
  UpdateTaskStatusDto,
} from '../presentation/dto/create-task-status.dto';
import { ReorderDto } from '../presentation/dto/reorder.dto';

@Injectable()
export class TaskStatusesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async findAll(workspaceId: string, userId: string) {
    await this.access.ensureMember(workspaceId, userId);

    const statuses = await this.prisma.taskStatus.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });

    return { data: statuses };
  }

  async create(workspaceId: string, userId: string, dto: CreateTaskStatusDto) {
    await this.access.ensureMember(workspaceId, userId);

    const maxPosition = await this.prisma.taskStatus.aggregate({
      where: { workspaceId },
      _max: { position: true },
    });

    const status = await this.prisma.taskStatus.create({
      data: {
        workspaceId,
        name: dto.name,
        color: dto.color ?? '#71717A',
        isDone: dto.isDone ?? false,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return { data: status };
  }

  async update(
    workspaceId: string,
    statusId: string,
    userId: string,
    dto: UpdateTaskStatusDto,
  ) {
    await this.ensureStatus(workspaceId, statusId, userId);

    const status = await this.prisma.taskStatus.update({
      where: { id: statusId },
      data: dto,
    });

    return { data: status };
  }

  async remove(workspaceId: string, statusId: string, userId: string) {
    await this.ensureStatus(workspaceId, statusId, userId);

    await this.prisma.taskStatus.delete({ where: { id: statusId } });

    return { data: { success: true } };
  }

  async reorder(workspaceId: string, userId: string, dto: ReorderDto) {
    await this.access.ensureMember(workspaceId, userId);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.taskStatus.update({
          where: { id: item.id, workspaceId },
          data: { position: item.position },
        }),
      ),
    );

    return this.findAll(workspaceId, userId);
  }

  private async ensureStatus(
    workspaceId: string,
    statusId: string,
    userId: string,
  ) {
    await this.access.ensureMember(workspaceId, userId);

    const status = await this.prisma.taskStatus.findFirst({
      where: { id: statusId, workspaceId },
    });

    if (!status) {
      throw new NotFoundException('Statut introuvable');
    }

    return status;
  }
}
