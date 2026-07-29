import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
import type {
  WorkspaceMemberSummary,
  WorkspaceInvite,
  WorkspaceInvitePreview,
  CreateWorkspaceInviteInput,
  AcceptInviteResponse,
} from '@work-pilot/shared';

export const workspaceApi = {
  listMembers: (workspaceId: string) =>
    api<{ data: WorkspaceMemberSummary[] }>(`${workspacePath(workspaceId)}/members`),

  listInvites: (workspaceId: string) =>
    api<{ data: WorkspaceInvite[] }>(`${workspacePath(workspaceId)}/invites`),

  createInvite: (workspaceId: string, input: CreateWorkspaceInviteInput) =>
    api<{ data: WorkspaceInvite }>(`${workspacePath(workspaceId)}/invites`, { method: 'POST', body: input }),

  revokeInvite: (workspaceId: string, inviteId: string) =>
    api<{ data: { success: boolean } }>(`${workspacePath(workspaceId)}/invites/${inviteId}`, {
      method: 'DELETE',
    }),

  previewInvite: (token: string) =>
    api<{ data: WorkspaceInvitePreview }>(`/invites/${token}`),

  acceptInvite: (token: string) =>
    api<{ data: AcceptInviteResponse }>(`/invites/${token}/accept`, { method: 'POST' }),

  pendingInvites: () => api<{ data: WorkspaceInvite[] }>('/invites/pending'),

  switchWorkspace: (workspaceId: string) =>
    api<{ data: { workspace: { id: string; name: string; slug: string; role: string }; tokens: { accessToken: string; refreshToken: string } } }>(
      `/auth/switch-workspace/${workspaceId}`,
      { method: 'POST' },
    ),
};
