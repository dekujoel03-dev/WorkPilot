import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { CreateProjectDto } from '../presentation/dto/create-project.dto';
import { UpdateProjectDto } from '../presentation/dto/update-project.dto';
import {
  EVENT_BUS,
  type IEventBus,
} from '../../../infrastructure/events/events.module';

const DEFAULT_LISTS = ['À faire', 'En cours', 'Terminé'];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async findAll(
    workspaceId: string,
    userId: string,
    archivedFilter: boolean | undefined = false,
  ) {
    await this.access.ensureMember(workspaceId, userId);

    const accessible = await this.access.listAccessibleProjectIds(
      workspaceId,
      userId,
    );

    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId,
        ...(archivedFilter === undefined ? {} : { archived: archivedFilter }),
        ...(accessible === 'all' ? {} : { id: { in: accessible } }),
      },
      include: { _count: { select: { tasks: true, lists: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return { data: projects };
  }

  async findOne(workspaceId: string, projectId: string, userId: string) {
    await this.access.ensureProjectAccess(
      workspaceId,
      projectId,
      userId,
      'VIEWER',
    );

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: { _count: { select: { tasks: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });

    return { data: project };
  }

  async create(workspaceId: string, userId: string, dto: CreateProjectDto) {
    const member = await this.access.ensureMember(workspaceId, userId);

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          name: dto.name,
          description: dto.description,
          color: dto.color ?? '#6366F1',
          teamId: dto.teamId,
        },
      });

      await tx.projectList.createMany({
        data: DEFAULT_LISTS.map((name, position) => ({
          projectId: created.id,
          name,
          position,
        })),
      });

      // Les invités (GUEST) ne voient que les projets dont ils sont membres
      if (member.role === 'GUEST') {
        await tx.projectMember.create({
          data: {
            projectId: created.id,
            userId,
            role: 'ADMIN',
          },
        });
      }

      return created;
    });

    void this.eventBus
      .publish({
        type: 'project.created',
        payload: {
          workspaceId,
          userId,
          entityType: 'PROJECT',
          entityId: project.id,
          name: project.name,
          description: project.description,
        },
        occurredAt: new Date(),
      })
      .catch((err) => {
        console.error('[ProjectsService] Event publish failed:', err);
      });

    return { data: project };
  }

  async update(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ) {
    await this.access.ensureCanEditProject(workspaceId, projectId, userId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });

    return { data: project };
  }

  async remove(workspaceId: string, projectId: string, userId: string) {
    await this.access.ensureCanEditProject(workspaceId, projectId, userId);

    await this.prisma.project.delete({ where: { id: projectId } });

    return { data: { success: true } };
  }
}
