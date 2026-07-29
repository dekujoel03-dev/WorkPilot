import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { activitiesApi } from '@/features/collaboration/api/collaboration.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';

export function useDashboardStats() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['dashboard-stats', workspaceId],
    queryFn: () => dashboardApi.stats(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useWorkspaceActivities() {
  const workspaceId = useWorkspaceId();
  return useQuery({
    queryKey: ['activities', workspaceId],
    queryFn: () => activitiesApi.byWorkspace(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
