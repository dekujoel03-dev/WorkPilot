import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AssistantResponse } from '@work-pilot/shared';
import { cn } from '@/lib/utils';

const DOCUMENT_LABELS: Record<string, string> = {
  USER_STORIES: 'User Stories',
  ACCEPTANCE_CRITERIA: "Critères d'acceptation",
  RISK_ANALYSIS: 'Analyse des risques',
  STATUS_REPORT: 'Rapport de statut',
  PROJECT_CHARTER: 'Charte de projet',
};

const PRIORITY_LABELS = { HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Faible' };
const LEVEL_LABELS = { HIGH: 'Élevée', MEDIUM: 'Moyenne', LOW: 'Faible' };

interface PmDocumentViewProps {
  document: AssistantResponse;
  onExport?: () => void;
  exporting?: boolean;
  className?: string;
}

export function PmDocumentView({
  document: doc,
  onExport,
  exporting,
  className,
}: PmDocumentViewProps) {
  const exportable =
    (doc.suggestedTasks?.length ?? 0) > 0 || (doc.userStories?.length ?? 0) > 0;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {doc.documentType && (
          <Badge variant="accent">{DOCUMENT_LABELS[doc.documentType] ?? doc.documentType}</Badge>
        )}
        {doc.projectName && (
          <span className="text-xs text-muted">Projet : {doc.projectName}</span>
        )}
      </div>

      {doc.executiveSummary && (
        <p className="text-sm text-muted leading-relaxed border-l-2 border-accent/40 pl-3">
          {doc.executiveSummary}
        </p>
      )}

      <div className="text-sm leading-relaxed whitespace-pre-wrap font-[450]">
        {doc.reply}
      </div>

      {doc.userStories && doc.userStories.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            User Stories
          </p>
          {doc.userStories.map((us) => (
            <div
              key={us.id}
              className="rounded-[var(--radius-md)] border border-border bg-background/60 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-accent">{us.id}</span>
                {us.priority && (
                  <span className="text-[10px] text-muted">
                    Priorité {PRIORITY_LABELS[us.priority]}
                  </span>
                )}
              </div>
              <p className="font-medium text-sm">{us.title}</p>
              <p className="text-xs text-muted leading-relaxed">
                En tant que {us.asA}, je veux {us.iWant}, afin de {us.soThat}.
              </p>
              {us.acceptanceCriteria.length > 0 && (
                <div className="text-xs space-y-1 pt-1">
                  <p className="font-medium text-muted">Critères d&apos;acceptation</p>
                  {us.acceptanceCriteria.map((ca, i) => (
                    <p key={i} className="pl-2 text-muted leading-relaxed">
                      CA-{i + 1}. {ca}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {doc.risks && doc.risks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Registre des risques
          </p>
          {doc.risks.map((r) => (
            <div
              key={r.id}
              className="rounded-[var(--radius-md)] border border-border bg-background/60 p-3 text-xs space-y-1"
            >
              <p className="font-mono text-accent">{r.id}</p>
              <p className="font-medium">{r.description}</p>
              <p className="text-muted">
                Probabilité {LEVEL_LABELS[r.probability]} — Impact {LEVEL_LABELS[r.impact]}
              </p>
              <p className="text-muted leading-relaxed">Mitigation : {r.mitigation}</p>
            </div>
          ))}
        </div>
      )}

      {exportable && onExport && (
        <Button size="sm" onClick={onExport} loading={exporting} className="w-full sm:w-auto">
          <FolderPlus className="h-4 w-4" />
          Créer le projet avec les User Stories
        </Button>
      )}
    </div>
  );
}
