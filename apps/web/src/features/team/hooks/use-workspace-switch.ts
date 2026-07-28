import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '@/features/auth/api/auth.api';
import { workspaceApi } from '@/features/team/api/workspace.api';
import { useAuthStore } from '@/stores/auth.store';

export function useWorkspaces() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => getMe(accessToken!),
    enabled: !!accessToken,
    select: (res) => res.data.workspaces,
  });
}

export function useSwitchWorkspace() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (workspaceId: string) => workspaceApi.switchWorkspace(workspaceId),
    onSuccess: (res) => {
      if (!user) return;
      setAuth({
        user,
        workspace: res.data.workspace,
        tokens: res.data.tokens,
      });
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
