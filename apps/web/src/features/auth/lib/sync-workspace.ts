import { getLastWorkspaceId, useAuthStore, type WorkspaceSummary } from '@/stores/auth.store';

/** Aligne le workspace actif avec les memberships serveur (ex. après seed ou reset DB). */
export async function syncActiveWorkspace(): Promise<boolean> {
  const { workspace, user, setWorkspace } = useAuthStore.getState();
  if (!user) return false;

  const response = await fetch('/api/v1/auth/me', {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) return false;

  const json = (await response.json()) as {
    data?: { workspaces?: WorkspaceSummary[] };
  };
  const workspaces = json.data?.workspaces ?? [];

  if (workspaces.length === 0) {
    setWorkspace(null);
    return false;
  }

  const lastId = getLastWorkspaceId();
  const match =
    workspaces.find((w) => w.id === workspace?.id) ??
    (lastId ? workspaces.find((w) => w.id === lastId) : undefined) ??
    workspaces[0];

  if (
    match.id !== workspace?.id ||
    match.name !== workspace?.name ||
    match.slug !== workspace?.slug ||
    match.role !== workspace?.role
  ) {
    setWorkspace(match);
  }

  return true;
}
