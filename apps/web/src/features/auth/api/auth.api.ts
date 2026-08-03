import { api } from '@/lib/api';
import { isSupabaseAuthEnabled, supabase } from '@/lib/supabase';

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

type RegisterResult =
  | AuthResponse
  | { data: { needsEmailConfirmation: true; email: string } };

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceName?: string;
  inviteToken?: string;
}): Promise<RegisterResult> {
  if (isSupabaseAuthEnabled()) {
    return api<RegisterResult>('/auth/supabase/signup', { method: 'POST', body: payload });
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

export async function getMe() {
  return api<{
    data: {
      user: AuthResponse['data']['user'];
      workspaces: Array<{ id: string; name: string; slug: string; role: string }>;
    };
  }>('/auth/me');
}
