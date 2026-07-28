import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true, projects: true, teams: true } },
          },
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('Accès au workspace refusé');
    }

    return {
      data: {
        id: member.workspace.id,
        name: member.workspace.name,
        slug: member.workspace.slug,
        logoUrl: member.workspace.logoUrl,
        role: member.role,
        counts: member.workspace._count,
      },
    };
  }

  async listMembers(workspaceId: string, userId: string) {
    await this.ensureMember(workspaceId, userId);

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
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
      orderBy: { joinedAt: 'asc' },
    });

    return {
      data: members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    };
  }

  private async ensureMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Workspace introuvable');
    }

    return member;
  }
}
