import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspace.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';
import type { CreateWorkspaceInviteInput } from '@work-pilot/shared';

export function useWorkspaceMembers() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspaceApi.listMembers(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useWorkspaceInvites(enabled = true) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['workspace-invites', workspaceId],
    queryFn: () => workspaceApi.listInvites(workspaceId!),
    enabled: !!workspaceId && enabled,
  });
}

export function useCreateInvite() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInviteInput) =>
      workspaceApi.createInvite(workspaceId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invites', workspaceId] });
    },
  });
}

export function useRevokeInvite() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => workspaceApi.revokeInvite(workspaceId!, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invites', workspaceId] });
    },
  });
}

export function usePendingInvites() {
  return useQuery({
    queryKey: ['pending-invites'],
    queryFn: () => workspaceApi.pendingInvites(),
  });
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => workspaceApi.previewInvite(token),
    enabled: !!token,
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => workspaceApi.acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
