import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { Prisma, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { InvitesService } from '../../workspace/application/invites.service';
import { RegisterDto } from '../presentation/dto/register.dto';
import { LoginDto } from '../presentation/dto/login.dto';
import { SupabaseRegisterDto } from '../presentation/dto/supabase-register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    @Inject(forwardRef(() => InvitesService))
    private readonly invitesService: InvitesService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    if (dto.inviteToken) {
      return this.registerWithInvite(dto);
    }

    if (!dto.workspaceName?.trim()) {
      throw new BadRequestException('Le nom du workspace est requis');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const workspaceName = dto.workspaceName.trim();

    const result = await this.createUserWithWorkspace({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      workspaceName,
    });

    const tokens = await this.issueTokens(
      result.user.id,
      result.user.email,
      result.workspace.id,
      'OWNER',
    );

    return {
      data: {
        user: this.toAuthUser(result.user),
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          slug: result.workspace.slug,
          role: 'OWNER' as const,
        },
        tokens,
      },
    };
  }

  async registerWithInvite(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    await this.prisma.reminderPreference.create({ data: { userId: user.id } });

    const workspace = await this.invitesService.acceptInviteForNewUser(
      user.id,
      dto.email.toLowerCase(),
      dto.inviteToken!,
    );

    const member = await this.prisma.workspaceMember.findUniqueOrThrow({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
      },
    });

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      workspace.id,
      member.role,
    );

    return {
      data: {
        user: this.toAuthUser(user),
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          role: member.role,
        },
        tokens,
      },
    };
  }

  issueTokensForWorkspace(
    userId: string,
    email: string,
    workspaceId: string,
    role: WorkspaceRole,
  ) {
    return this.issueTokens(userId, email, workspaceId, role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        workspaceMembers: {
          include: { workspace: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const membership =
      (dto.workspaceId
        ? user.workspaceMembers.find((m) => m.workspaceId === dto.workspaceId)
        : undefined) ?? user.workspaceMembers[0];

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      membership?.workspaceId,
      membership?.role,
    );

    return {
      data: {
        user: this.toAuthUser(user),
        workspace: membership
          ? {
              id: membership.workspace.id,
              name: membership.workspace.name,
              slug: membership.workspace.slug,
              role: membership.role,
            }
          : null,
        workspaces: user.workspaceMembers.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          role: m.role,
        })),
        tokens,
      },
    };
  }

  async refresh(refreshToken: string, workspaceId?: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            workspaceMembers: {
              include: { workspace: true },
              orderBy: { joinedAt: 'asc' },
            },
          },
        },
      },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const membership =
      (workspaceId
        ? stored.user.workspaceMembers.find(
            (m) => m.workspaceId === workspaceId,
          )
        : undefined) ?? stored.user.workspaceMembers[0];

    const tokens = await this.issueTokens(
      stored.user.id,
      stored.user.email,
      membership?.workspaceId,
      membership?.role,
    );

    return {
      data: {
        tokens,
        workspace: membership
          ? {
              id: membership.workspace.id,
              name: membership.workspace.name,
              slug: membership.workspace.slug,
              role: membership.role,
            }
          : null,
      },
    };
  }

  async logout(refreshToken: string | undefined, userId?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, revoked: false },
        data: { revoked: true },
      });
    } else if (userId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }
    return { data: { success: true } };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        workspaceMembers: {
          include: { workspace: true },
        },
      },
    });

    return {
      data: {
        user: this.toAuthUser(user),
        workspaces: user.workspaceMembers.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          role: m.role,
        })),
      },
    };
  }

  async createSessionFromSupabase(
    supabaseAccessToken: string,
    workspaceId?: string,
  ) {
    if (!this.supabase.isConfigured()) {
      throw new BadRequestException('Supabase Auth non configuré');
    }

    let supabaseUser;
    try {
      supabaseUser = await this.supabase.verifyAccessToken(supabaseAccessToken);
    } catch {
      throw new UnauthorizedException('Session Supabase invalide');
    }

    if (!supabaseUser.email) {
      throw new UnauthorizedException('Email Supabase manquant');
    }

    const user = await this.findOrLinkAppUser(supabaseUser.id, supabaseUser.email);
    return this.buildAuthResponse(user, workspaceId);
  }

  async signUpWithSupabase(dto: RegisterDto) {
    if (!this.supabase.isConfigured()) {
      throw new BadRequestException('Supabase Auth non configuré');
    }

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    let supabaseUser;
    try {
      supabaseUser = await this.supabase.createAuthUser(email, dto.password, {
        emailConfirm: isDev,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Inscription Supabase impossible';
      throw new BadRequestException(message);
    }

    if (!supabaseUser?.email) {
      throw new BadRequestException('Impossible de créer le compte Supabase');
    }

    if (isDev && !supabaseUser.email_confirmed_at) {
      const confirmed = await this.supabase.confirmAuthUser(supabaseUser.id);
      if (!confirmed?.email) {
        throw new BadRequestException('Impossible de confirmer le compte Supabase');
      }
      supabaseUser = confirmed;
    }

    const emailConfirmed = !!supabaseUser.email_confirmed_at;
    const authResponse = await this.provisionAppUserFromSupabase(supabaseUser, dto);

    if (!emailConfirmed) {
      return {
        data: {
          needsEmailConfirmation: true as const,
          email,
        },
      };
    }

    return authResponse;
  }

  async registerWithSupabase(
    supabaseAccessToken: string,
    dto: SupabaseRegisterDto,
  ) {
    if (!this.supabase.isConfigured()) {
      throw new BadRequestException('Supabase Auth non configuré');
    }

    let supabaseUser;
    try {
      supabaseUser = await this.supabase.verifyAccessToken(supabaseAccessToken);
    } catch {
      throw new UnauthorizedException('Session Supabase invalide');
    }

    if (!supabaseUser.email) {
      throw new UnauthorizedException('Email Supabase manquant');
    }

    const email = supabaseUser.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    return this.provisionAppUserFromSupabase(supabaseUser, dto);
  }

  private async provisionAppUserFromSupabase(
    supabaseUser: { id: string; email?: string; email_confirmed_at?: string | null },
    dto: SupabaseRegisterDto,
  ) {
    const email = supabaseUser.email!.toLowerCase();

    if (dto.inviteToken) {
      const user = await this.prisma.user.create({
        data: {
          email,
          authProviderId: supabaseUser.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          emailVerified: !!supabaseUser.email_confirmed_at,
        },
      });

      await this.prisma.reminderPreference.create({ data: { userId: user.id } });

      const workspace = await this.invitesService.acceptInviteForNewUser(
        user.id,
        email,
        dto.inviteToken,
      );

      const member = await this.prisma.workspaceMember.findUniqueOrThrow({
        where: {
          workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
        },
      });

      const tokens = await this.issueTokens(
        user.id,
        user.email,
        workspace.id,
        member.role,
      );

      return {
        data: {
          user: this.toAuthUser(user),
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            role: member.role,
          },
          tokens,
        },
      };
    }

    if (!dto.workspaceName?.trim()) {
      throw new BadRequestException('Le nom du workspace est requis');
    }

    const result = await this.createUserWithWorkspace({
      email,
      authProviderId: supabaseUser.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailVerified: !!supabaseUser.email_confirmed_at,
      workspaceName: dto.workspaceName.trim(),
    });

    const tokens = await this.issueTokens(
      result.user.id,
      result.user.email,
      result.workspace.id,
      'OWNER',
    );

    return {
      data: {
        user: this.toAuthUser(result.user),
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          slug: result.workspace.slug,
          role: 'OWNER' as const,
        },
        tokens,
      },
    };
  }

  private async findOrLinkAppUser(authProviderId: string, email: string) {
    const normalizedEmail = email.toLowerCase();

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ authProviderId }, { email: normalizedEmail }],
      },
      include: {
        workspaceMembers: {
          include: { workspace: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Compte applicatif introuvable. Terminez votre inscription.',
      );
    }

    if (!user.authProviderId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { authProviderId },
        include: {
          workspaceMembers: {
            include: { workspace: true },
            orderBy: { joinedAt: 'asc' },
          },
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  private async buildAuthResponse(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      workspaceMembers: Array<{
        workspaceId: string;
        role: WorkspaceRole;
        workspace: { id: string; name: string; slug: string };
      }>;
    },
    workspaceId?: string,
  ) {
    const membership =
      (workspaceId
        ? user.workspaceMembers.find((m) => m.workspaceId === workspaceId)
        : undefined) ?? user.workspaceMembers[0];

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      membership?.workspaceId,
      membership?.role,
    );

    return {
      data: {
        user: this.toAuthUser(user),
        workspace: membership
          ? {
              id: membership.workspace.id,
              name: membership.workspace.name,
              slug: membership.workspace.slug,
              role: membership.role,
            }
          : null,
        workspaces: user.workspaceMembers.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          role: m.role,
        })),
        tokens,
      },
    };
  }

  private async createUserWithWorkspace(params: {
    email: string;
    authProviderId?: string;
    passwordHash?: string;
    firstName: string;
    lastName: string;
    emailVerified?: boolean;
    workspaceName: string;
  }) {
    const slug = this.generateSlug(params.workspaceName);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email: params.email,
          authProviderId: params.authProviderId,
          passwordHash: params.passwordHash,
          firstName: params.firstName,
          lastName: params.lastName,
          emailVerified: params.emailVerified ?? false,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: params.workspaceName,
          slug,
          members: {
            create: { userId: user.id, role: 'OWNER' },
          },
          statuses: {
            createMany: {
              data: [
                {
                  name: 'À faire',
                  color: '#71717A',
                  position: 0,
                  isDone: false,
                },
                {
                  name: 'En cours',
                  color: '#6366F1',
                  position: 1,
                  isDone: false,
                },
                {
                  name: 'Terminé',
                  color: '#22C55E',
                  position: 2,
                  isDone: true,
                },
              ],
            },
          },
        },
      });

      await tx.reminderPreference.create({ data: { userId: user.id } });

      return { user, workspace };
    });
  }

  async switchWorkspace(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });

    if (!member) {
      throw new UnauthorizedException("Vous n'êtes pas membre de ce workspace");
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const tokens = await this.issueTokens(
      userId,
      user.email,
      workspaceId,
      member.role,
    );

    return {
      data: {
        workspace: {
          id: member.workspace.id,
          name: member.workspace.name,
          slug: member.workspace.slug,
          role: member.role,
        },
        tokens,
      },
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    workspaceId?: string,
    role?: WorkspaceRole,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, workspaceId, role };
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');

    const accessToken = this.jwt.sign(payload, {
      secret,
      expiresIn: 900,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshDays = parseInt(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d').replace('d', ''),
      10,
    );

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return `${base}-${randomBytes(3).toString('hex')}`;
  }
}
