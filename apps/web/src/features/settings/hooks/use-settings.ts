import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';

export function useAIStatus() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['ai-status', workspaceId],
    queryFn: () => settingsApi.aiStatus(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useWebhooks() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['webhooks', workspaceId],
    queryFn: () => settingsApi.listWebhooks(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateWebhook() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { url: string; events: string[] }) =>
      settingsApi.createWebhook(workspaceId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', workspaceId] });
    },
  });
}

export function useDeleteWebhook() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => settingsApi.deleteWebhook(workspaceId!, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', workspaceId] });
    },
  });
}
