import { api } from '@/lib/api';
import type {
  Project,
  ProjectList,
  Task,
  TaskStatus,
  CreateProjectInput,
  UpdateProjectInput,
  CreateProjectListInput,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  ProjectMember,
  AddProjectMemberInput,
  ProjectRole,
} from '@work-pilot/shared';

function ws(workspaceId: string) {
  return `/workspaces/${workspaceId}`;
}

export const projectsApi = {
  list: (workspaceId: string, archived?: 'true' | 'all') => {
    const query = archived ? `?archived=${archived}` : '';
    return api<{ data: Project[] }>(`${ws(workspaceId)}/projects${query}`);
  },

  get: (workspaceId: string, projectId: string) =>
    api<{ data: Project & { lists: ProjectList[] } }>(`${ws(workspaceId)}/projects/${projectId}`),

  create: (workspaceId: string, input: CreateProjectInput) =>
    api<{ data: Project }>(`${ws(workspaceId)}/projects`, { method: 'POST', body: input }),

  update: (workspaceId: string, projectId: string, input: UpdateProjectInput) =>
    api<{ data: Project }>(`${ws(workspaceId)}/projects/${projectId}`, { method: 'PATCH', body: input }),

  remove: (workspaceId: string, projectId: string) =>
    api<{ data: { success: boolean } }>(`${ws(workspaceId)}/projects/${projectId}`, { method: 'DELETE' }),
};

export const projectListsApi = {
  list: (workspaceId: string, projectId: string) =>
    api<{ data: ProjectList[] }>(`${ws(workspaceId)}/projects/${projectId}/project-lists`),

  create: (workspaceId: string, projectId: string, input: CreateProjectListInput) =>
    api<{ data: ProjectList }>(`${ws(workspaceId)}/projects/${projectId}/project-lists`, {
      method: 'POST',
      body: input,
    }),
};

export const taskStatusesApi = {
  list: (workspaceId: string) =>
    api<{ data: TaskStatus[] }>(`${ws(workspaceId)}/task-statuses`),
};

export const tasksApi = {
  listByProject: (workspaceId: string, projectId: string) =>
    api<{ data: Task[] }>(`${ws(workspaceId)}/projects/${projectId}/tasks`),

  create: (workspaceId: string, projectId: string, input: CreateTaskInput) =>
    api<{ data: Task }>(`${ws(workspaceId)}/projects/${projectId}/tasks`, {
      method: 'POST',
      body: input,
    }),

  update: (workspaceId: string, taskId: string, input: UpdateTaskInput) =>
    api<{ data: Task }>(`${ws(workspaceId)}/tasks/${taskId}`, { method: 'PATCH', body: input }),

  move: (workspaceId: string, taskId: string, input: MoveTaskInput) =>
    api<{ data: Task }>(`${ws(workspaceId)}/tasks/${taskId}/move`, { method: 'PATCH', body: input }),

  remove: (workspaceId: string, taskId: string) =>
    api<{ data: { success: boolean } }>(`${ws(workspaceId)}/tasks/${taskId}`, { method: 'DELETE' }),
};

export const projectMembersApi = {
  list: (workspaceId: string, projectId: string) =>
    api<{ data: ProjectMember[] }>(`${ws(workspaceId)}/projects/${projectId}/members`),

  add: (workspaceId: string, projectId: string, input: AddProjectMemberInput) =>
    api<{ data: import('@work-pilot/shared').AddProjectMemberResult | ProjectMember }>(
      `${ws(workspaceId)}/projects/${projectId}/members`,
      { method: 'POST', body: input },
    ),

  updateRole: (workspaceId: string, projectId: string, memberId: string, role: ProjectRole) =>
    api<{ data: ProjectMember }>(`${ws(workspaceId)}/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: { role },
    }),

  remove: (workspaceId: string, projectId: string, memberId: string) =>
    api<{ data: { success: boolean } }>(
      `${ws(workspaceId)}/projects/${projectId}/members/${memberId}`,
      { method: 'DELETE' },
    ),
};
