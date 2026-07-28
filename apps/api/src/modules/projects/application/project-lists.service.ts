import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import {
  CreateProjectListDto,
  UpdateProjectListDto,
} from '../presentation/dto/create-project-list.dto';
import { ReorderDto } from '../presentation/dto/reorder.dto';

@Injectable()
export class ProjectListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async findAll(workspaceId: string, projectId: string, userId: string) {
    await this.access.ensureProjectAccess(workspaceId, projectId, userId);

    const lists = await this.prisma.projectList.findMany({
      where: { projectId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { position: 'asc' },
    });

    return { data: lists };
  }

  async create(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: CreateProjectListDto,
  ) {
    await this.access.ensureProjectAccess(workspaceId, projectId, userId);

    const maxPosition = await this.prisma.projectList.aggregate({
      where: { projectId },
      _max: { position: true },
    });

    const list = await this.prisma.projectList.create({
      data: {
        projectId,
        name: dto.name,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return { data: list };
  }

  async update(
    workspaceId: string,
    projectId: string,
    listId: string,
    userId: string,
    dto: UpdateProjectListDto,
  ) {
    await this.ensureList(workspaceId, projectId, listId, userId);

    const list = await this.prisma.projectList.update({
      where: { id: listId },
      data: dto,
    });

    return { data: list };
  }

  async remove(
    workspaceId: string,
    projectId: string,
    listId: string,
    userId: string,
  ) {
    await this.ensureList(workspaceId, projectId, listId, userId);

    await this.prisma.projectList.delete({ where: { id: listId } });

    return { data: { success: true } };
  }

  async reorder(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: ReorderDto,
  ) {
    await this.access.ensureProjectAccess(workspaceId, projectId, userId);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.projectList.update({
          where: { id: item.id, projectId },
          data: { position: item.position },
        }),
      ),
    );

    return this.findAll(workspaceId, projectId, userId);
  }

  private async ensureList(
    workspaceId: string,
    projectId: string,
    listId: string,
    userId: string,
  ) {
    await this.access.ensureProjectAccess(workspaceId, projectId, userId);

    const list = await this.prisma.projectList.findFirst({
      where: { id: listId, projectId },
    });

    if (!list) {
      throw new NotFoundException('Liste introuvable');
    }

    return list;
  }
}
