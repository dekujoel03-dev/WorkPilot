export interface WebhookSummary {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  secret?: string;
}

export interface AIProviderStatus {
  provider: 'ollama' | 'openai' | 'mock';
  model: string | null;
  available: boolean;
  label: string;
}

export interface AddProjectMemberResult {
  pending?: boolean;
  inviteUrl?: string;
  message?: string;
  email?: string;
  id?: string;
  projectId?: string;
  userId?: string;
  role?: import('./project-sharing').ProjectRole;
  createdAt?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}
