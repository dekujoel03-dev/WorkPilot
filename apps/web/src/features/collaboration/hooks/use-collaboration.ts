import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi, attachmentsApi, activitiesApi } from '../api/collaboration.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';
import type { CreateCommentInput } from '@work-pilot/shared';

export function useComments(taskId: string | null) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['comments', workspaceId, taskId],
    queryFn: () => commentsApi.list(workspaceId!, taskId!),
    enabled: !!workspaceId && !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      commentsApi.create(workspaceId!, taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', workspaceId, taskId] });
      queryClient.invalidateQueries({ queryKey: ['activities', workspaceId, taskId] });
    },
  });
}

export function useAttachments(taskId: string | null) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['attachments', workspaceId, taskId],
    queryFn: () => attachmentsApi.list(workspaceId!, taskId!),
    enabled: !!workspaceId && !!taskId,
  });
}

export function useUploadAttachment(taskId: string) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(workspaceId!, taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', workspaceId, taskId] });
      queryClient.invalidateQueries({ queryKey: ['activities', workspaceId, taskId] });
    },
  });
}

export function useTaskActivities(taskId: string | null) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['activities', workspaceId, taskId],
    queryFn: () => activitiesApi.byTask(workspaceId!, taskId!),
    enabled: !!workspaceId && !!taskId,
  });
}
