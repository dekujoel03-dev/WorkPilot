import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WorkspaceAccessService } from '../../../common/services/workspace-access.service';
import type { SearchResultItem } from '@work-pilot/shared';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async search(
    workspaceId: string,
    userId: string,
    q: string,
    types?: string[],
  ) {
    await this.access.ensureMember(workspaceId, userId);
    const accessible = await this.access.listAccessibleProjectIds(workspaceId, userId);
    const projectScope = this.access.projectIdScopeFilter(accessible);
    const taskScope = this.access.projectScopeFilter(accessible);

    const query = q.trim();
    if (query.length < 1) {
      return this.empty(query);
    }

    const enabled = new Set(types ?? ['project', 'task', 'person', 'comment']);
    const like = query;

    const [projects, tasks, members, comments] = await Promise.all([
      enabled.has('project')
        ? this.prisma.project.findMany({
            where: {
              workspaceId,
              archived: false,
              ...projectScope,
              OR: [
                { name: { contains: like } },
                { description: { contains: like } },
              ],
            },
            take: 8,
            orderBy: { updatedAt: 'desc' },
          })
        : [],
      enabled.has('task')
        ? this.prisma.task.findMany({
            where: {
              workspaceId,
              parentId: null,
              ...taskScope,
              OR: [
                { title: { contains: like } },
                { description: { contains: like } },
              ],
            },
            include: { project: { select: { name: true } } },
            take: 10,
            orderBy: { updatedAt: 'desc' },
          })
        : [],
      enabled.has('person')
        ? this.prisma.workspaceMember.findMany({
            where: {
              workspaceId,
              user: {
                OR: [
                  { firstName: { contains: like } },
                  { lastName: { contains: like } },
                  { email: { contains: like } },
                ],
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            take: 8,
          })
        : [],
      enabled.has('comment')
        ? this.prisma.comment.findMany({
            where: {
              content: { contains: like },
              task: { workspaceId, ...taskScope },
            },
            include: {
              task: { select: { id: true, title: true, projectId: true } },
            },
            take: 8,
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    const projectResults: SearchResultItem[] = projects.map((p) => ({
      id: p.id,
      type: 'project',
      title: p.name,
      subtitle: p.description ?? undefined,
      href: `/app/projects/${p.id}`,
    }));

    const taskResults: SearchResultItem[] = tasks.map((t) => ({
      id: t.id,
      type: 'task',
      title: t.title,
      subtitle: t.project.name,
      href: `/app/projects/${t.projectId}`,
      meta: { taskId: t.id, projectId: t.projectId },
    }));

    const peopleResults: SearchResultItem[] = members.map((m) => ({
      id: m.user.id,
      type: 'person',
      title: `${m.user.firstName} ${m.user.lastName}`,
      subtitle: m.user.email,
      href: '#',
    }));

    const commentResults: SearchResultItem[] = comments.map((c) => ({
      id: c.id,
      type: 'comment',
      title: c.content.slice(0, 80) + (c.content.length > 80 ? '…' : ''),
      subtitle: c.task.title,
      href: `/app/projects/${c.task.projectId}`,
      meta: { taskId: c.task.id },
    }));

    const results = [
      ...projectResults,
      ...taskResults,
      ...peopleResults,
      ...commentResults,
    ];

    return {
      data: {
        query,
        results,
        grouped: {
          projects: projectResults,
          tasks: taskResults,
          people: peopleResults,
          comments: commentResults,
        },
      },
    };
  }

  private empty(query: string) {
    return {
      data: {
        query,
        results: [],
        grouped: { projects: [], tasks: [], people: [], comments: [] },
      },
    };
  }
}
