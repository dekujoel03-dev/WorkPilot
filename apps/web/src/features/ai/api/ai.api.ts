import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
import type { AIJob, AssistantChatInput, AssistantMessage } from '@work-pilot/shared';

export const aiApi = {
  listJobs: (workspaceId: string) =>
    api<{ data: AIJob[] }>(`${workspacePath(workspaceId)}/ai/jobs`),

  chat: (workspaceId: string, input: AssistantChatInput) =>
    api<{ data: AIJob }>(`${workspacePath(workspaceId)}/ai/assistant`, { method: 'POST', body: input }),

  breakdownProject: (workspaceId: string, projectId: string) =>
    api<{ data: AIJob }>(`${workspacePath(workspaceId)}/ai/projects/${projectId}/breakdown`, {
      method: 'POST',
    }),
};

export type { AssistantMessage };
