import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
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

export const projectsApi = {
  list: (workspaceId: string, archived?: 'true' | 'all') => {
    const query = archived ? `?archived=${archived}` : '';
    return api<{ data: Project[] }>(`${workspacePath(workspaceId)}/projects${query}`);
  },

  get: (workspaceId: string, projectId: string) =>
    api<{ data: Project & { lists: ProjectList[] } }>(`${workspacePath(workspaceId)}/projects/${projectId}`),

  create: (workspaceId: string, input: CreateProjectInput) =>
    api<{ data: Project }>(`${workspacePath(workspaceId)}/projects`, { method: 'POST', body: input }),

  update: (workspaceId: string, projectId: string, input: UpdateProjectInput) =>
    api<{ data: Project }>(`${workspacePath(workspaceId)}/projects/${projectId}`, { method: 'PATCH', body: input }),

  remove: (workspaceId: string, projectId: string) =>
    api<{ data: { success: boolean } }>(`${workspacePath(workspaceId)}/projects/${projectId}`, { method: 'DELETE' }),
};

export const projectListsApi = {
  list: (workspaceId: string, projectId: string) =>
    api<{ data: ProjectList[] }>(`${workspacePath(workspaceId)}/projects/${projectId}/project-lists`),

  create: (workspaceId: string, projectId: string, input: CreateProjectListInput) =>
    api<{ data: ProjectList }>(`${workspacePath(workspaceId)}/projects/${projectId}/project-lists`, {
      method: 'POST',
      body: input,
    }),
};

export const taskStatusesApi = {
  list: (workspaceId: string) =>
    api<{ data: TaskStatus[] }>(`${workspacePath(workspaceId)}/task-statuses`),
};

export const tasksApi = {
  listByProject: (workspaceId: string, projectId: string) =>
    api<{ data: Task[] }>(`${workspacePath(workspaceId)}/projects/${projectId}/tasks`),

  create: (workspaceId: string, projectId: string, input: CreateTaskInput) =>
    api<{ data: Task }>(`${workspacePath(workspaceId)}/projects/${projectId}/tasks`, {
      method: 'POST',
      body: input,
    }),

  update: (workspaceId: string, taskId: string, input: UpdateTaskInput) =>
    api<{ data: Task }>(`${workspacePath(workspaceId)}/tasks/${taskId}`, { method: 'PATCH', body: input }),

  move: (workspaceId: string, taskId: string, input: MoveTaskInput) =>
    api<{ data: Task }>(`${workspacePath(workspaceId)}/tasks/${taskId}/move`, { method: 'PATCH', body: input }),

  remove: (workspaceId: string, taskId: string) =>
    api<{ data: { success: boolean } }>(`${workspacePath(workspaceId)}/tasks/${taskId}`, { method: 'DELETE' }),
};

export const projectMembersApi = {
  list: (workspaceId: string, projectId: string) =>
    api<{ data: ProjectMember[] }>(`${workspacePath(workspaceId)}/projects/${projectId}/members`),

  add: (workspaceId: string, projectId: string, input: AddProjectMemberInput) =>
    api<{ data: import('@work-pilot/shared').AddProjectMemberResult | ProjectMember }>(
      `${workspacePath(workspaceId)}/projects/${projectId}/members`,
      { method: 'POST', body: input },
    ),

  updateRole: (workspaceId: string, projectId: string, memberId: string, role: ProjectRole) =>
    api<{ data: ProjectMember }>(`${workspacePath(workspaceId)}/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: { role },
    }),

  remove: (workspaceId: string, projectId: string, memberId: string) =>
    api<{ data: { success: boolean } }>(
      `${workspacePath(workspaceId)}/projects/${projectId}/members/${memberId}`,
      { method: 'DELETE' },
    ),
};
