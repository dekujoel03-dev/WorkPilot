import {
  Injectable,
  Inject,
  forwardRef,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuthService } from '../../auth/application/auth.service';
import { NotificationService } from '../../collaboration/application/notification.service';
import type { WorkspaceRole, ProjectRole } from '@prisma/client';
import { CreateInviteDto } from '../presentation/dto/create-invite.dto';

const INVITE_TTL_DAYS = 7;
const ADMIN_ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN'];

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly notifications: NotificationService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateInviteDto) {
    await this.ensureAdmin(workspaceId, userId);
    return this.createInvite(workspaceId, userId, dto.email, {
      role: (dto.role ?? 'MEMBER') as WorkspaceRole,
    });
  }

  async createForProjectShare(
    workspaceId: string,
    actorId: string,
    email: string,
    projectId: string,
    projectRole: ProjectRole,
  ) {
    await this.prisma.workspaceMember.findUniqueOrThrow({
      where: { workspaceId_userId: { workspaceId, userId: actorId } },
    });
    return this.createInvite(workspaceId, actorId, email, {
      role: 'GUEST',
      projectId,
      projectRole,
    });
  }

  private async createInvite(
    workspaceId: string,
    userId: string,
    rawEmail: string,
    opts: {
      role: WorkspaceRole;
      projectId?: string;
      projectRole?: ProjectRole;
    },
  ) {
    const email = rawEmail.toLowerCase().trim();
    const role = opts.role;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser && !opts.projectId) {
      const member = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (member) {
        throw new ConflictException(
          'Cet utilisateur est déjà membre du workspace',
        );
      }
    }

    const pending = await this.prisma.workspaceInvite.findFirst({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (pending) {
      throw new ConflictException(
        'Une invitation est déjà en attente pour cet email',
      );
    }

    const token = randomBytes(32).toString('hex');
    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email,
        role,
        projectId: opts.projectId,
        projectRole: opts.projectRole,
        token,
        invitedById: userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        project: { select: { id: true, name: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (existingUser) {
      const title = opts.projectId
        ? `Accès projet — ${invite.project?.name ?? 'Projet'}`
        : `Invitation — ${invite.workspace.name}`;
      const body = opts.projectId
        ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName} vous invite à collaborer sur un projet.`
        : `${invite.invitedBy.firstName} ${invite.invitedBy.lastName} vous invite à rejoindre l'équipe.`;

      await this.notifications.create({
        userId: existingUser.id,
        type: opts.projectId ? 'PROJECT_SHARED' : 'WORKSPACE_INVITE',
        title,
        body,
        data: {
          inviteToken: token,
          inviteId: invite.id,
          workspaceId,
          workspaceName: invite.workspace.name,
          role: invite.role,
          projectId: opts.projectId,
          projectName: invite.project?.name,
          projectRole: opts.projectRole,
        },
      });
    }

    return { data: this.toDto(invite) };
  }

  async list(workspaceId: string, userId: string) {
    await this.ensureAdmin(workspaceId, userId);

    const invites = await this.prisma.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return { data: invites.map((i) => this.toDto(i)) };
  }

  async revoke(workspaceId: string, userId: string, inviteId: string) {
    await this.ensureAdmin(workspaceId, userId);

    const invite = await this.prisma.workspaceInvite.findFirst({
      where: { id: inviteId, workspaceId, acceptedAt: null },
    });
    if (!invite) throw new NotFoundException('Invitation introuvable');

    await this.prisma.workspaceInvite.delete({ where: { id: inviteId } });
    return { data: { success: true } };
  }

  async preview(token: string) {
    const invite = await this.findValidInvite(token);
    return {
      data: {
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt.toISOString(),
        workspace: invite.workspace,
        project: invite.project
          ? { id: invite.project.id, name: invite.project.name }
          : null,
        projectRole: invite.projectRole,
      },
    };
  }

  async listPendingForUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const invites = await this.prisma.workspaceInvite.findMany({
      where: {
        email: user.email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { workspace: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { data: invites.map((i) => this.toDto(i)) };
  }

  async accept(token: string, userId: string) {
    const invite = await this.findValidInvite(token);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ForbiddenException(
        'Cette invitation est destinée à une autre adresse email. Connectez-vous avec le bon compte.',
      );
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId },
      },
    });

    if (existing) {
      await this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    } else {
      await this.prisma.$transaction([
        this.prisma.workspaceMember.create({
          data: {
            workspaceId: invite.workspaceId,
            userId,
            role: invite.role,
          },
        }),
        this.prisma.workspaceInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
        this.prisma.reminderPreference.upsert({
          where: { userId },
          create: { userId },
          update: {},
        }),
      ]);
    }

    await this.grantProjectAccess(invite, userId, invite.invitedById);

    const tokens = await this.authService.issueTokensForWorkspace(
      userId,
      user.email,
      invite.workspaceId,
      invite.role,
    );

    return {
      data: {
        workspace: invite.workspace,
        tokens,
      },
    };
  }

  async acceptInviteForNewUser(
    userId: string,
    email: string,
    inviteToken: string,
  ) {
    const invite = await this.findValidInvite(inviteToken);

    if (email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new BadRequestException("L'email ne correspond pas à l'invitation");
    }

    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        },
      }),
      this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    await this.grantProjectAccess(invite, userId, invite.invitedById);

    return invite.workspace;
  }

  private async grantProjectAccess(
    invite: {
      projectId: string | null;
      projectRole: ProjectRole | null;
      invitedById: string;
    },
    userId: string,
    addedById: string,
  ) {
    if (!invite.projectId || !invite.projectRole) return;

    await this.prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: invite.projectId, userId },
      },
      create: {
        projectId: invite.projectId,
        userId,
        role: invite.projectRole,
        addedById,
      },
      update: { role: invite.projectRole },
    });
  }

  private async findValidInvite(token: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!invite || invite.acceptedAt) {
      throw new NotFoundException('Invitation invalide ou déjà utilisée');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Cette invitation a expiré');
    }

    return invite;
  }

  private async ensureAdmin(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new NotFoundException('Workspace introuvable');
    if (!ADMIN_ROLES.includes(member.role)) {
      throw new ForbiddenException(
        'Seuls les admins peuvent gérer les invitations',
      );
    }
    return member;
  }

  private toDto(invite: {
    id: string;
    workspaceId: string;
    email: string;
    role: WorkspaceRole;
    token: string;
    expiresAt: Date;
    acceptedAt: Date | null;
    createdAt: Date;
    projectId?: string | null;
    projectRole?: ProjectRole | null;
    workspace?: { id: string; name: string; slug: string };
    project?: { id: string; name: string } | null;
  }) {
    return {
      id: invite.id,
      workspaceId: invite.workspaceId,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
      acceptedAt: invite.acceptedAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
      inviteUrl: `/invite/${invite.token}`,
      workspace: invite.workspace,
      projectId: invite.projectId ?? null,
      projectRole: invite.projectRole ?? null,
      project: invite.project ?? null,
    };
  }
}
