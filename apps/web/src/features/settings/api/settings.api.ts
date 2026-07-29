import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
import type { AIProviderStatus, WebhookSummary } from '@work-pilot/shared';

export const settingsApi = {
  aiStatus: (workspaceId: string) =>
    api<{ data: AIProviderStatus }>(`${workspacePath(workspaceId)}/ai/status`),

  listWebhooks: (workspaceId: string) =>
    api<{ data: WebhookSummary[] }>(`${workspacePath(workspaceId)}/webhooks`),

  createWebhook: (workspaceId: string, input: { url: string; events: string[] }) =>
    api<{ data: WebhookSummary }>(`${workspacePath(workspaceId)}/webhooks`, {
      method: 'POST',
      body: input,
    }),

  deleteWebhook: (workspaceId: string, webhookId: string) =>
    api<{ data: { success: boolean } }>(`${workspacePath(workspaceId)}/webhooks/${webhookId}`, {
      method: 'DELETE',
    }),
};
