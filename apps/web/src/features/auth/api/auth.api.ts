import { api } from '@/lib/api';
import { isSupabaseAuthEnabled, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

interface AuthResponse {
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    workspace: { id: string; name: string; slug: string; role?: string } | null;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  };
}

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceName?: string;
  inviteToken?: string;
}) {
  if (isSupabaseAuthEnabled() && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (error) throw new Error(error.message);

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new Error(
        'Confirmez votre email avant de continuer, ou désactivez la confirmation email dans Supabase (dev).',
      );
    }

    return api<AuthResponse>('/auth/supabase/register', {
      method: 'POST',
      body: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        workspaceName: payload.workspaceName,
        inviteToken: payload.inviteToken,
      },
      token: accessToken,
    });
  }

  return api<AuthResponse>('/auth/register', { method: 'POST', body: payload });
}

export async function login(payload: {
  email: string;
  password: string;
  workspaceId?: string;
}) {
  if (isSupabaseAuthEnabled() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) throw new Error(error.message);

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new Error('Session Supabase indisponible');
    }

    return api<AuthResponse>('/auth/supabase/session', {
      method: 'POST',
      body: { workspaceId: payload.workspaceId },
      token: accessToken,
    });
  }

  return api<AuthResponse>('/auth/login', { method: 'POST', body: payload });
}

export async function refreshAccessToken() {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) throw new Error('No refresh token');

  const response = await api<{ data: { tokens: { accessToken: string; refreshToken: string } } }>(
    '/auth/refresh',
    { method: 'POST', body: { refreshToken } },
  );

  useAuthStore.getState().setTokens(response.data.tokens);
  return response.data.tokens.accessToken;
}

export async function getMe(token: string) {
  return api<{
    data: {
      user: AuthResponse['data']['user'];
      workspaces: Array<{ id: string; name: string; slug: string; role: string }>;
    };
  }>('/auth/me', { token });
}
