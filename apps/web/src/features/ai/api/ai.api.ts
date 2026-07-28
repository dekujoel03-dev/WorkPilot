import { api } from '@/lib/api';
import type { AIJob, AssistantChatInput, AssistantMessage } from '@work-pilot/shared';

function ws(workspaceId: string) {
  return `/workspaces/${workspaceId}`;
}

export const aiApi = {
  listJobs: (workspaceId: string) =>
    api<{ data: AIJob[] }>(`${ws(workspaceId)}/ai/jobs`),

  getJob: (workspaceId: string, jobId: string) =>
    api<{ data: AIJob }>(`${ws(workspaceId)}/ai/jobs/${jobId}`),

  chat: (workspaceId: string, input: AssistantChatInput) =>
    api<{ data: AIJob }>(`${ws(workspaceId)}/ai/assistant`, { method: 'POST', body: input }),

  breakdownProject: (workspaceId: string, projectId: string) =>
    api<{ data: AIJob }>(`${ws(workspaceId)}/ai/projects/${projectId}/breakdown`, {
      method: 'POST',
    }),

  assessTaskRisk: (workspaceId: string, taskId: string) =>
    api<{ data: AIJob }>(`${ws(workspaceId)}/ai/tasks/${taskId}/risk`, { method: 'POST' }),

  status: (workspaceId: string) =>
    api<{ data: import('@work-pilot/shared').AIProviderStatus }>(`${ws(workspaceId)}/ai/status`),
};

export type { AssistantMessage };
