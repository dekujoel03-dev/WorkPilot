import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { intelligenceApi } from '../api/intelligence.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';
import type { ReminderAction } from '@work-pilot/shared';

export function useDailyBrief() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['daily-brief', workspaceId],
    queryFn: () => intelligenceApi.dailyBrief(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useSmartReminders() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['reminders', workspaceId],
    queryFn: () => intelligenceApi.reminders(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useSyncReminders() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => intelligenceApi.syncReminders(workspaceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', workspaceId] });
    },
  });
}

export function useReminderAction() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ reminderId, action }: { reminderId: string; action: ReminderAction }) =>
      intelligenceApi.reminderAction(workspaceId!, reminderId, action),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['daily-brief', workspaceId] });
      if (variables.action === 'START_NOW' && result.data.projectId) {
        navigate(`/app/projects/${result.data.projectId}`);
      }
    },
  });
}
