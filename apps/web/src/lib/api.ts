import { useAuthStore, getLastWorkspaceId } from '@/stores/auth.store';
import { syncActiveWorkspace } from '@/features/auth/lib/sync-workspace';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
  /** @internal */
  _retried?: boolean;
  /** @internal */
  _workspaceRetried?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { workspace } = useAuthStore.getState();

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId: workspace?.id }),
    credentials: 'include',
  });

  const text = await response.text();
  let data: {
    data?: {
      tokens?: { accessToken: string; refreshToken: string };
      workspace?: { id: string; name: string; slug: string; role?: string } | null;
    };
    message?: string;
  } | null = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError('INVALID_RESPONSE', 'Réponse serveur invalide', response.status);
    }
  }

  if (!response.ok) {
    useAuthStore.getState().logout();
    throw new ApiError(
      'SESSION_EXPIRED',
      data?.message ?? 'Session expirée. Reconnectez-vous.',
      response.status,
    );
  }

  const accessToken = data?.data?.tokens?.accessToken ?? null;
  if (accessToken) {
    useAuthStore.getState().setAccessToken(accessToken);
  }
  if (data?.data?.workspace) {
    useAuthStore.getState().setWorkspace(data.data.workspace);
  }
  return accessToken;
}

async function ensureRefreshedToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function parseResponse(text: string, status: number): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('INVALID_RESPONSE', 'Réponse serveur invalide', status);
  }
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  403: 'Accès refusé. Reconnectez-vous ou sélectionnez un autre workspace.',
  404: 'Ressource introuvable.',
  500: 'Erreur serveur. Réessayez dans un instant.',
  502: 'Service indisponible. Vérifiez que l’API est démarrée (pnpm dev:api).',
  503: 'Service temporairement indisponible.',
};

function throwApiError(status: number, data: unknown): never {
  const payload = data as { error?: { message?: string; code?: string }; message?: string | string[] } | null;
  const rawMessage = payload?.error?.message ?? payload?.message;
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : rawMessage ??
      (status === 401
        ? 'Session expirée. Reconnectez-vous.'
        : (DEFAULT_STATUS_MESSAGES[status] ?? 'Une erreur est survenue'));
  const code = payload?.error?.code ?? (status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN_ERROR');
  throw new ApiError(code, message, status);
}

export async function api<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    token: tokenOverride,
    headers: customHeaders,
    _retried = false,
    _workspaceRetried = false,
    ...rest
  } = options;
  const token = tokenOverride ?? useAuthStore.getState().accessToken;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const text = await response.text();
  const data = parseResponse(text, response.status);

  const isAuthRoute =
    endpoint.startsWith('/auth/login') ||
    endpoint.startsWith('/auth/register') ||
    endpoint.startsWith('/auth/supabase/') ||
    endpoint.startsWith('/auth/refresh') ||
    endpoint.startsWith('/auth/logout');

  if (response.status === 401 && !_retried && !isAuthRoute && tokenOverride === undefined) {
    try {
      await ensureRefreshedToken();
      return api<T>(endpoint, { ...options, _retried: true });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      useAuthStore.getState().logout();
      throw new ApiError('SESSION_EXPIRED', 'Session expirée. Reconnectez-vous.', 401);
    }
  }

  if (response.status === 403 && !_workspaceRetried && !isAuthRoute) {
    try {
      const synced = await syncActiveWorkspace();
      if (synced) {
        return api<T>(endpoint, { ...options, _workspaceRetried: true });
      }
    } catch {
      // ignore sync errors and fall through to throwApiError
    }
  }

  if (!response.ok) {
    throwApiError(response.status, data);
  }

  return data as T;
}

export async function logoutSession() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore network errors during logout
  }
  useAuthStore.getState().logout();
}

export async function restoreSessionFromCookies(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  if (response.ok) {
    const data = (await response.json()) as {
      data: {
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          avatarUrl: string | null;
        };
        workspaces: Array<{ id: string; name: string; slug: string; role: string }>;
      };
    };
    const { workspace: persistedWorkspace } = useAuthStore.getState();
    const lastWorkspaceId = getLastWorkspaceId();
    const activeWorkspace =
      (persistedWorkspace &&
        data.data.workspaces.find((w) => w.id === persistedWorkspace.id)) ??
      (lastWorkspaceId && data.data.workspaces.find((w) => w.id === lastWorkspaceId)) ??
      data.data.workspaces[0] ??
      null;

    useAuthStore.getState().setSession({
      user: data.data.user,
      workspace: activeWorkspace
        ? {
            id: activeWorkspace.id,
            name: activeWorkspace.name,
            slug: activeWorkspace.slug,
            role: activeWorkspace.role,
          }
        : null,
    });
    await refreshAccessToken().catch(() => null);
    return true;
  }

  if (response.status === 401) {
    try {
      await refreshAccessToken();
      return restoreSessionFromCookies();
    } catch {
      useAuthStore.getState().logout();
      return false;
    }
  }

  return false;
}
