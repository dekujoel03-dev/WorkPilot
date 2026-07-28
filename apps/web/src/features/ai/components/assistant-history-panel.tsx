import { History, MessageSquarePlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConversationThread } from '../lib/assistant-conversation';
import { CURRENT_CONVERSATION_ID, formatDiscussionDate } from '../lib/assistant-conversation';
import { cn } from '@/lib/utils';

interface AssistantHistoryPanelProps {
  threads: ConversationThread[];
  activeJobId: string | null;
  hasActiveConversation: boolean;
  onSelect: (jobId: string) => void;
  onNewConversation: () => void;
}

export function AssistantHistoryPanel({
  threads,
  activeJobId,
  hasActiveConversation,
  onSelect,
  onNewConversation,
}: AssistantHistoryPanelProps) {
  return (
    <Card className="flex flex-col min-h-[480px] lg:max-h-[calc(100dvh-10rem)]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 shrink-0 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <History className="h-4 w-4 text-accent shrink-0" />
          <CardTitle className="text-base">Historique des discussions</CardTitle>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs shrink-0"
          onClick={onNewConversation}
          title="Nouvelle discussion"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto pt-3">
        {threads.length === 0 && !hasActiveConversation && (
          <div className="text-center py-10 px-2">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-muted/40" />
            <p className="text-sm text-muted">Aucune discussion enregistrée</p>
            <p className="text-xs text-muted mt-1">
              Vos échanges avec le Copilote PM apparaîtront ici
            </p>
          </div>
        )}

        {threads.length === 0 && hasActiveConversation && (
          <p className="text-xs text-muted text-center py-4">
            Discussion en cours — elle sera ajoutée à l&apos;historique après votre premier échange.
          </p>
        )}

        <ul className="space-y-1">
          {threads.map((thread) => {
            const isActive =
              activeJobId === thread.jobId ||
              (!activeJobId && hasActiveConversation && thread.jobId === CURRENT_CONVERSATION_ID);

            return (
              <li key={thread.jobId}>
                <button
                  type="button"
                  onClick={() => onSelect(thread.jobId)}
                  className={cn(
                    'w-full text-left rounded-[var(--radius-md)] px-3 py-2.5 transition-colors border border-transparent',
                    'hover:bg-surface-hover hover:border-border/60',
                    isActive && 'bg-accent/10 border-accent/25 ring-1 ring-accent/15',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-snug line-clamp-2 flex-1">
                      {thread.title}
                    </p>
                    <span className="text-[10px] text-muted shrink-0 tabular-nums">
                      {formatDiscussionDate(thread.updatedAt)}
                    </span>
                  </div>
                  {thread.preview && (
                    <p className="text-xs text-muted mt-1 truncate">{thread.preview}</p>
                  )}
                  <p className="text-[10px] text-accent/90 mt-1.5">
                    {thread.messageCount} message{thread.messageCount > 1 ? 's' : ''} · Reprendre
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
