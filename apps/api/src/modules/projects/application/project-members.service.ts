import {
  Injectable,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import { NotificationService } from '../../collaboration/application/notification.service';
import { InvitesService } from '../../workspace/application/invites.service';
import type { ProjectRole } from '@prisma/client';
import { AddProjectMemberDto } from '../presentation/dto/add-project-member.dto';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly notifications: NotificationService,
    private readonly invites: InvitesService,
  ) {}

  async list(workspaceId: string, projectId: string, userId: string) {
    await this.access.ensureProjectAccess(
      workspaceId,
      projectId,
      userId,
      'VIEWER',
    );

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: members.map((m) => ({
        id: m.id,
        projectId: m.projectId,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
        user: m.user,
      })),
    };
  }

  async add(
    workspaceId: string,
    projectId: string,
    actorId: string,
    dto: AddProjectMemberDto,
  ) {
    const { project } = await this.access.ensureCanEditProject(
      workspaceId,
      projectId,
      actorId,
    );
    const email = dto.email.toLowerCase().trim();
    const role = dto.role ?? 'EDITOR';

    const targetUser = await this.prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      const invite = await this.invites.createForProjectShare(
        workspaceId,
        actorId,
        email,
        projectId,
        role,
      );
      return {
        data: {
          pending: true,
          inviteUrl: invite.data.inviteUrl,
          email,
          message:
            'Invitation envoyée — la personne recevra un lien pour créer un compte et accéder au projet.',
        },
      };
    }

    if (targetUser.id === actorId) {
      throw new BadRequestException('Vous avez déjà accès à ce projet');
    }

    const actor = await this.prisma.user.findUniqueOrThrow({
      where: { id: actorId },
    });

    let wsMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
    });

    if (!wsMember) {
      wsMember = await this.prisma.workspaceMember.create({
        data: { workspaceId, userId: targetUser.id, role: 'GUEST' },
      });
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUser.id } },
    });
    if (existing) {
      throw new ConflictException('Cette personne a déjà accès au projet');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role,
        addedById: actorId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const roleLabel = { VIEWER: 'lecteur', EDITOR: 'éditeur', ADMIN: 'admin' }[
      role
    ];

    await this.notifications.create({
      userId: targetUser.id,
      type: 'PROJECT_SHARED',
      title: `Accès au projet « ${project.name} »`,
      body: `${actor.firstName} ${actor.lastName} vous a ajouté en tant qu'${roleLabel}.`,
      data: {
        workspaceId,
        projectId,
        projectName: project.name,
        role,
        actorName: `${actor.firstName} ${actor.lastName}`,
      },
    });

    return {
      data: {
        id: member.id,
        projectId: member.projectId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        user: member.user,
      },
    };
  }

  async updateRole(
    workspaceId: string,
    projectId: string,
    actorId: string,
    memberId: string,
    role: ProjectRole,
  ) {
    await this.access.ensureCanEditProject(workspaceId, projectId, actorId);

    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) throw new BadRequestException('Membre introuvable');

    const updated = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      data: {
        id: updated.id,
        projectId: updated.projectId,
        userId: updated.userId,
        role: updated.role,
        createdAt: updated.createdAt.toISOString(),
        user: updated.user,
      },
    };
  }

  async remove(
    workspaceId: string,
    projectId: string,
    actorId: string,
    memberId: string,
  ) {
    await this.access.ensureCanEditProject(workspaceId, projectId, actorId);

    const member = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) throw new BadRequestException('Membre introuvable');

    await this.prisma.projectMember.delete({ where: { id: memberId } });
    return { data: { success: true } };
  }
}
