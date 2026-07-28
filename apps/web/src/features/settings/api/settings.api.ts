import { api } from '@/lib/api';
import type { AIProviderStatus, WebhookSummary } from '@work-pilot/shared';

function ws(workspaceId: string) {
  return `/workspaces/${workspaceId}`;
}

export const settingsApi = {
  aiStatus: (workspaceId: string) =>
    api<{ data: AIProviderStatus }>(`${ws(workspaceId)}/ai/status`),

  listWebhooks: (workspaceId: string) =>
    api<{ data: WebhookSummary[] }>(`${ws(workspaceId)}/webhooks`),

  createWebhook: (workspaceId: string, input: { url: string; events: string[] }) =>
    api<{ data: WebhookSummary }>(`${ws(workspaceId)}/webhooks`, {
      method: 'POST',
      body: input,
    }),

  deleteWebhook: (workspaceId: string, webhookId: string) =>
    api<{ data: { success: boolean } }>(`${ws(workspaceId)}/webhooks/${webhookId}`, {
      method: 'DELETE',
    }),
};
