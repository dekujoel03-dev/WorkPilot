import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, projectListsApi, tasksApi, taskStatusesApi } from '../api/projects.api';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api';
import type { CreateProjectInput, CreateTaskInput, MoveTaskInput, UpdateTaskInput, UpdateProjectInput } from '@work-pilot/shared';

export function useWorkspaceId() {
  return useAuthStore((s) => s.workspace?.id);
}

export function useProjects(archived?: 'true' | 'all') {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['projects', workspaceId, archived ?? 'active'],
    queryFn: () => projectsApi.list(workspaceId!, archived),
    enabled: !!workspaceId,
  });
}

export function useUpdateProject(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) =>
      projectsApi.update(workspaceId!, projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project', workspaceId, projectId] });
    },
  });
}

export function useProject(projectId: string) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['project', workspaceId, projectId],
    queryFn: () => projectsApi.get(workspaceId!, projectId),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useCreateProject() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => {
      if (!workspaceId) {
        throw new ApiError('NO_WORKSPACE', 'Aucun workspace actif. Reconnectez-vous.', 400);
      }
      return projectsApi.create(workspaceId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}

export function useProjectTasks(projectId: string) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['tasks', workspaceId, projectId],
    queryFn: () => tasksApi.listByProject(workspaceId!, projectId),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useTaskStatuses() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['task-statuses', workspaceId],
    queryFn: () => taskStatusesApi.list(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateTask(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(workspaceId!, projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      tasksApi.update(workspaceId!, taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}

export function useMoveTask(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: MoveTaskInput }) =>
      tasksApi.move(workspaceId!, taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(workspaceId!, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', workspaceId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });
}

export function useCreateProjectList(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => projectListsApi.create(workspaceId!, projectId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', workspaceId, projectId] });
    },
  });
}
