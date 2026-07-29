import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '@/features/auth/api/auth.api';
import { workspaceApi } from '@/features/team/api/workspace.api';
import { useAuthStore } from '@/stores/auth.store';

export function useWorkspaces() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => getMe(),
    enabled: !!user,
    select: (res) => res.data.workspaces,
  });
}

export function useSwitchWorkspace() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (workspaceId: string) => workspaceApi.switchWorkspace(workspaceId),
    onSuccess: (res) => {
      if (!user) return;
      setSession({
        user,
        workspace: res.data.workspace,
        accessToken: res.data.tokens.accessToken,
      });
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
