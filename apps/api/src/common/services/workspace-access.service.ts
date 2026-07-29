import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ProjectRole, WorkspaceRole } from '@prisma/client';

const FULL_ACCESS_ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN', 'MEMBER'];
const ROLE_RANK: Record<ProjectRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export interface ProjectAccess {
  project: {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
  };
  projectRole: ProjectRole;
}

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Accès au workspace refusé');
    }

    return member;
  }

  async getWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace introuvable');
    }

    return workspace;
  }

  async getProjectRole(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<ProjectRole | null> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) return null;

    if (FULL_ACCESS_ROLES.includes(member.role)) {
      return 'ADMIN';
    }

    const pm = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return pm?.role ?? null;
  }

  async ensureProjectAccess(
    workspaceId: string,
    projectId: string,
    userId: string,
    minRole: ProjectRole = 'VIEWER',
  ): Promise<ProjectAccess> {
    const member = await this.ensureMember(workspaceId, userId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
    });
    if (!project) {
      throw new NotFoundException('Projet introuvable');
    }

    let projectRole: ProjectRole;

    if (FULL_ACCESS_ROLES.includes(member.role)) {
      projectRole = 'ADMIN';
    } else if (member.role === 'GUEST') {
      const pm = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (!pm) {
        throw new ForbiddenException("Vous n'avez pas accès à ce projet");
      }
      projectRole = pm.role;
    } else {
      throw new ForbiddenException('Accès refusé');
    }

    if (ROLE_RANK[projectRole] < ROLE_RANK[minRole]) {
      throw new ForbiddenException(
        'Permissions insuffisantes pour cette action',
      );
    }

    return { project, projectRole };
  }

  async ensureTaskAccess(workspaceId: string, taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!task) {
      throw new NotFoundException('Tâche introuvable');
    }

    await this.ensureProjectAccess(
      workspaceId,
      task.projectId,
      userId,
      'VIEWER',
    );
    return task;
  }

  async ensureCanEditProject(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    return this.ensureProjectAccess(workspaceId, projectId, userId, 'ADMIN');
  }

  async ensureCanEditTasks(
    workspaceId: string,
    projectId: string,
    userId: string,
  ) {
    return this.ensureProjectAccess(workspaceId, projectId, userId, 'EDITOR');
  }

  async listAccessibleProjectIds(
    workspaceId: string,
    userId: string,
  ): Promise<string[] | 'all'> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) return [];

    if (FULL_ACCESS_ROLES.includes(member.role)) {
      return 'all';
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { userId, project: { workspaceId } },
      select: { projectId: true },
    });
    return memberships.map((m: { projectId: string }) => m.projectId);
  }

  async ensureWorkspaceAdmin(workspaceId: string, userId: string) {
    const member = await this.ensureMember(workspaceId, userId);
    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Action réservée aux administrateurs');
    }
    return member;
  }

  async ensureCanManageWorkspaceSettings(workspaceId: string, userId: string) {
    return this.ensureWorkspaceAdmin(workspaceId, userId);
  }

  projectScopeFilter(accessible: string[] | 'all') {
    if (accessible === 'all') return {};
    if (accessible.length === 0) {
      return { projectId: { in: ['__none__'] } };
    }
    return { projectId: { in: accessible } };
  }

  projectIdScopeFilter(accessible: string[] | 'all') {
    if (accessible === 'all') return {};
    if (accessible.length === 0) {
      return { id: { in: ['__none__'] } };
    }
    return { id: { in: accessible } };
  }
}
