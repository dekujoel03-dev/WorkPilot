import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssistantHistoryPanel } from '../components/assistant-history-panel';
import { useAssistantChat, useAIJobs } from '../hooks/use-ai';
import { useAIStatus } from '@/features/settings/hooks/use-settings';
import { useAuthStore } from '@/stores/auth.store';
import { PmDocumentView } from '../components/pm-document-view';
import { projectsApi, tasksApi } from '@/features/projects/api/projects.api';
import type { AssistantMessage, AssistantResponse } from '@work-pilot/shared';
import { parseAssistantResponse } from '@work-pilot/shared';
import {
  buildConversationThreads,
  buildCurrentConversationThread,
  clearStoredConversation,
  CURRENT_CONVERSATION_ID,
  loadStoredConversation,
  restoreAssistantConversationFromJob,
  saveStoredConversation,
  type StoredAssistantMessage,
} from '../lib/assistant-conversation';
import { buildProjectDescription, buildTasksFromPmDocument } from '../lib/export-pm-document';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api';

type ChatMessage = StoredAssistantMessage;

function toApiHistory(messages: ChatMessage[]): AssistantMessage[] {
  return messages.map(({ role, content, timestamp }) => ({ role, content, timestamp }));
}

export function AssistantPage() {
  const navigate = useNavigate();
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const chat = useAssistantChat();
  const { data: jobsData } = useAIJobs();
  const { data: aiStatusData } = useAIStatus();
  const bottomRef = useRef<HTMLDivElement>(null);

  const savedThreads = buildConversationThreads(jobsData?.data ?? []);
  const currentThread = buildCurrentConversationThread(messages, activeJobId);
  const discussionThreads =
    currentThread && !savedThreads.some((t) => t.jobId === currentThread.jobId)
      ? [currentThread, ...savedThreads.filter((t) => t.jobId !== activeJobId)]
      : savedThreads;
  const aiLabel = aiStatusData?.data?.label;

  useEffect(() => {
    if (!workspaceId || hydrated) return;
    const stored = loadStoredConversation(workspaceId);
    if (stored?.messages.length) {
      setMessages(stored.messages);
      setActiveJobId(stored.activeJobId);
    }
    setHydrated(true);
  }, [workspaceId, hydrated]);

  useEffect(() => {
    if (!workspaceId || !hydrated) return;
    saveStoredConversation(workspaceId, messages, activeJobId);
  }, [workspaceId, messages, activeJobId, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleExportToProject = async (doc: AssistantResponse, messageIndex: number) => {
    if (!workspaceId) return;

    setExportingIndex(messageIndex);
    setError(null);

    try {
      const tasks = buildTasksFromPmDocument(doc);
      if (tasks.length === 0) {
        setError('Aucun besoin à importer dans ce document.');
        return;
      }

      const project = await projectsApi.create(workspaceId, {
        name: doc.projectName ?? 'Projet IA',
        description: buildProjectDescription(doc),
      });

      const projectDetail = await projectsApi.get(workspaceId, project.data.id);
      const backlogListId = projectDetail.data.lists?.[0]?.id;

      const createdTasks = [];
      for (const task of tasks) {
        const result = await tasksApi.create(workspaceId, project.data.id, {
          ...task,
          listId: backlogListId,
        });
        createdTasks.push(result.data);
      }

      navigate(`/app/projects/${project.data.id}`, {
        state: {
          importedFromAssistant: true,
          importedCount: createdTasks.length,
          openTaskId: createdTasks[0]?.id,
        },
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Impossible de créer le projet',
      );
    } finally {
      setExportingIndex(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || chat.isPending) return;

    if (!workspaceId) {
      setError('Aucun espace de travail actif. Reconnectez-vous.');
      return;
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);

    try {
      const result = await chat.mutateAsync({
        message: text,
        history: toApiHistory(messages),
      });

      const job = result.data;
      if (job.status === 'FAILED') {
        const errMsg =
          typeof job.output === 'object' && job.output && 'error' in job.output
            ? String(job.output.error)
            : 'Le traitement IA a échoué.';
        setError(errMsg);
        return;
      }

      const pmDocument = parseAssistantResponse(job.output ?? null);
      const reply = pmDocument?.reply ?? 'Réponse indisponible.';

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        pmDocument: pmDocument ?? undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setActiveJobId(job.id);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Impossible de contacter l\'assistant. Réessayez dans un instant.';
      setError(message);
    }
  };

  const handleRestoreJob = (jobId: string) => {
    if (jobId === CURRENT_CONVERSATION_ID || jobId === activeJobId) return;

    setError(null);
    const job = (jobsData?.data ?? []).find((j) => j.id === jobId);
    if (!job || job.type !== 'ASSISTANT') return;

    const restored = restoreAssistantConversationFromJob(job);
    if (restored.length === 0) return;
    setMessages(restored);
    setActiveJobId(job.id);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setActiveJobId(null);
    setInput('');
    setError(null);
    if (workspaceId) clearStoredConversation(workspaceId);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto h-full flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-xl font-semibold">Assistant projet</h1>
            <p className="text-sm text-muted">
              {aiLabel ?? 'Chargement…'} — besoins, critères, risques et rapports
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0">
        <Card className="lg:col-span-2 flex flex-col min-h-[480px]">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-4 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted text-sm">
                  <Bot className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>Besoins utilisateur, critères, risques et rapports de statut.</p>
                  <p className="mt-2 text-xs">
                    Ex. : « Plan pour une application de facturation »
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-accent" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-[var(--radius-md)] px-3 py-2 text-sm max-w-[90%]',
                      msg.role === 'user'
                        ? 'bg-accent text-accent-foreground whitespace-pre-wrap'
                        : 'bg-surface-hover border border-border w-full max-w-none',
                    )}
                  >
                    {msg.role === 'assistant' && msg.pmDocument ? (
                      <PmDocumentView
                        document={msg.pmDocument}
                        onExport={() => handleExportToProject(msg.pmDocument!, i)}
                        exporting={exportingIndex === i}
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {error && (
              <p className="text-sm text-destructive mb-3 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-3 py-2">
                {error}
              </p>
            )}

            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Votre message…"
                disabled={chat.isPending}
              />
              <Button type="submit" size="sm" loading={chat.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <AssistantHistoryPanel
          threads={discussionThreads}
          activeJobId={activeJobId}
          hasActiveConversation={messages.length > 0}
          onSelect={handleRestoreJob}
          onNewConversation={handleNewConversation}
        />
      </div>
    </div>
  );
}
