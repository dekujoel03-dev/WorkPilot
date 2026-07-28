import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';
import type { AssistantChatInput } from '@work-pilot/shared';

export function useAIJobs() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['ai-jobs', workspaceId],
    queryFn: () => aiApi.listJobs(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useAIJob(jobId: string | null) {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['ai-job', workspaceId, jobId],
    queryFn: () => aiApi.getJob(workspaceId!, jobId!),
    enabled: !!workspaceId && !!jobId,
  });
}

export function useAssistantChat() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssistantChatInput) => aiApi.chat(workspaceId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', workspaceId] });
    },
  });
}

export function useBreakdownProject() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => aiApi.breakdownProject(workspaceId!, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', workspaceId] });
    },
  });
}

export function useAssessTaskRisk() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => aiApi.assessTaskRisk(workspaceId!, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', workspaceId] });
    },
  });
}
