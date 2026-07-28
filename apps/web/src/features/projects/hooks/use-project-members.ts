import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectMembersApi } from '../api/projects.api';
import { useWorkspaceId } from './use-projects';
import type { AddProjectMemberInput, ProjectRole } from '@work-pilot/shared';

export function useProjectMembers(projectId: string) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['project-members', workspaceId, projectId],
    queryFn: () => projectMembersApi.list(workspaceId!, projectId),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useAddProjectMember(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddProjectMemberInput) =>
      projectMembersApi.add(workspaceId!, projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', workspaceId, projectId] });
    },
  });
}

export function useUpdateProjectMemberRole(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: ProjectRole }) =>
      projectMembersApi.updateRole(workspaceId!, projectId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', workspaceId, projectId] });
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      projectMembersApi.remove(workspaceId!, projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', workspaceId, projectId] });
    },
  });
}
