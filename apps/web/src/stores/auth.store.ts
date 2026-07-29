import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

const LAST_WORKSPACE_KEY = 'work-pilot-last-workspace';

export function getLastWorkspaceId(): string | null {
  try {
    return localStorage.getItem(LAST_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

function persistLastWorkspaceId(workspaceId: string | undefined) {
  try {
    if (workspaceId) localStorage.setItem(LAST_WORKSPACE_KEY, workspaceId);
  } catch {
    // ignore storage errors
  }
}

interface AuthState {
  user: AuthUser | null;
  workspace: WorkspaceSummary | null;
  /** En mémoire uniquement — les cookies httpOnly portent la session */
  accessToken: string | null;
  setSession: (payload: {
    user: AuthUser;
    workspace: WorkspaceSummary | null;
    accessToken?: string | null;
  }) => void;
  setAccessToken: (accessToken: string | null) => void;
  setWorkspace: (workspace: WorkspaceSummary | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      workspace: null,
      accessToken: null,
      setSession: ({ user, workspace, accessToken = null }) => {
        persistLastWorkspaceId(workspace?.id);
        set({ user, workspace, accessToken });
      },
      setAccessToken: (accessToken) => set({ accessToken }),
      setWorkspace: (workspace) => {
        persistLastWorkspaceId(workspace?.id);
        set({ workspace });
      },
      logout: () =>
        set({
          user: null,
          workspace: null,
          accessToken: null,
        }),
    }),
    {
      name: 'work-pilot-auth',
      partialize: (state) => ({
        user: state.user,
        workspace: state.workspace,
      }),
    },
  ),
);

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'work-pilot-theme' },
  ),
);
