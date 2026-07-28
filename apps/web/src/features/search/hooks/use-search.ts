import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';

export function useSearch(query: string, enabled = true) {
  const workspaceId = useWorkspaceId();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search', workspaceId, trimmed],
    queryFn: () => searchApi.search(workspaceId!, trimmed),
    enabled: !!workspaceId && enabled && trimmed.length >= 1,
    staleTime: 10_000,
  });
}
