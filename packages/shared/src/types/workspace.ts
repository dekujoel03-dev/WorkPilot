import type { WorkspaceRole } from './index';
import type { UserSummary } from './collaboration';
import type { ProjectRole } from './project-sharing';

export interface WorkspaceMemberSummary {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: UserSummary & { email: string };
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  inviteUrl?: string;
  workspace?: { id: string; name: string; slug: string };
  projectId?: string | null;
  projectRole?: ProjectRole | null;
  project?: { id: string; name: string } | null;
}

export interface WorkspaceInvitePreview {
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  workspace: { id: string; name: string; slug: string };
  project?: { id: string; name: string } | null;
  projectRole?: ProjectRole | null;
}

export interface CreateWorkspaceInviteInput {
  email: string;
  role?: WorkspaceRole;
}

export interface AcceptInviteResponse {
  workspace: { id: string; name: string; slug: string };
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}
