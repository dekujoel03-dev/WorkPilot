import type { AIJob, AssistantMessage, AssistantResponse } from '@work-pilot/shared';
import { parseAssistantResponse } from '@work-pilot/shared';

export interface StoredAssistantMessage extends AssistantMessage {
  pmDocument?: AssistantResponse;
}

const STORAGE_PREFIX = 'work-pilot-assistant';

function storageKey(workspaceId: string) {
  return `${STORAGE_PREFIX}-${workspaceId}`;
}

export function loadStoredConversation(workspaceId: string): {
  messages: StoredAssistantMessage[];
  activeJobId: string | null;
} | null {
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      messages?: StoredAssistantMessage[];
      activeJobId?: string | null;
    };
    if (!Array.isArray(parsed.messages)) return null;
    return {
      messages: parsed.messages,
      activeJobId: parsed.activeJobId ?? null,
    };
  } catch {
    return null;
  }
}

export function saveStoredConversation(
  workspaceId: string,
  messages: StoredAssistantMessage[],
  activeJobId: string | null,
) {
  try {
    localStorage.setItem(
      storageKey(workspaceId),
      JSON.stringify({ messages, activeJobId }),
    );
  } catch {
    // ignore quota errors
  }
}

export function clearStoredConversation(workspaceId: string) {
  try {
    localStorage.removeItem(storageKey(workspaceId));
  } catch {
    // ignore
  }
}

export function restoreAssistantConversationFromJob(job: AIJob): StoredAssistantMessage[] {
  if (job.type !== 'ASSISTANT') return [];

  const input = job.input as { message?: string; history?: AssistantMessage[] };
  const messages: StoredAssistantMessage[] = (input.history ?? []).map((item) => ({
    role: item.role,
    content: item.content,
    timestamp: item.timestamp,
  }));

  if (input.message?.trim()) {
    messages.push({
      role: 'user',
      content: input.message.trim(),
      timestamp: job.createdAt,
    });
  }

  if (job.status === 'COMPLETED' && job.output) {
    const pmDocument = parseAssistantResponse(job.output);
    messages.push({
      role: 'assistant',
      content: pmDocument?.reply ?? 'Réponse indisponible.',
      timestamp: job.completedAt ?? job.createdAt,
      pmDocument: pmDocument ?? undefined,
    });
  }

  return messages;
}

export function assistantJobPreview(job: AIJob): string | null {
  if (job.type !== 'ASSISTANT') return null;
  const input = job.input as { message?: string };
  const text = input.message?.trim();
  if (!text) return null;
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

export interface ConversationThread {
  jobId: string;
  title: string;
  preview: string | null;
  updatedAt: string;
  messageCount: number;
}

const CURRENT_CONVERSATION_ID = '__current__';

export { CURRENT_CONVERSATION_ID };

export function buildCurrentConversationThread(
  messages: StoredAssistantMessage[],
  activeJobId: string | null,
): ConversationThread | null {
  if (messages.length === 0) return null;

  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser?.content?.trim()) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const title = firstUser.content.trim();
  const preview =
    lastUser && lastUser !== firstUser
      ? lastUser.content.length > 48
        ? `${lastUser.content.slice(0, 48)}…`
        : lastUser.content
      : null;

  const lastMessage = messages[messages.length - 1];

  return {
    jobId: activeJobId ?? CURRENT_CONVERSATION_ID,
    title: title.length > 52 ? `${title.slice(0, 52)}…` : title,
    preview,
    updatedAt: lastMessage.timestamp ?? new Date().toISOString(),
    messageCount: messages.length,
  };
}

function conversationSignature(messages: StoredAssistantMessage[]): string {
  return messages.map((m) => `${m.role}:${m.content}`).join('|');
}

/** Regroupe les jobs Assistant en fils de discussion (dernier état par conversation). */
export function buildConversationThreads(jobs: AIJob[]): ConversationThread[] {
  const assistantJobs = jobs
    .filter((j) => j.type === 'ASSISTANT' && j.status === 'COMPLETED')
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    );

  const consumed = new Set<string>();
  const threads: ConversationThread[] = [];

  for (const job of assistantJobs) {
    if (consumed.has(job.id)) continue;

    const messages = restoreAssistantConversationFromJob(job);
    if (messages.length === 0) continue;

    const signature = conversationSignature(messages);

    for (const other of assistantJobs) {
      if (other.id === job.id || consumed.has(other.id)) continue;
      const otherMessages = restoreAssistantConversationFromJob(other);
      const otherSignature = conversationSignature(otherMessages);
      if (
        otherSignature !== signature &&
        signature.startsWith(otherSignature) &&
        otherMessages.length < messages.length
      ) {
        consumed.add(other.id);
      }
    }

    const firstUser = messages.find((m) => m.role === 'user');
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const title = firstUser?.content?.trim() ?? 'Discussion';
    const preview =
      lastUser && lastUser !== firstUser
        ? lastUser.content.length > 48
          ? `${lastUser.content.slice(0, 48)}…`
          : lastUser.content
        : assistantJobPreview(job);

    threads.push({
      jobId: job.id,
      title: title.length > 52 ? `${title.slice(0, 52)}…` : title,
      preview,
      updatedAt: job.completedAt ?? job.createdAt,
      messageCount: messages.length,
    });
  }

  return threads;
}

export function formatDiscussionDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
