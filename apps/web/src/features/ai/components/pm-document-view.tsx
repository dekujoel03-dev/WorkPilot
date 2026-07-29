import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AssistantResponse } from '@work-pilot/shared';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  USER_STORIES: 'Besoins utilisateur',
  ACCEPTANCE_CRITERIA: "Critères d'acceptation",
  RISK_ANALYSIS: 'Analyse des risques',
  STATUS_REPORT: 'Rapport de statut',
  PROJECT_CHARTER: 'Plan de projet',
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
          <Badge variant="accent">{TYPE_LABELS[doc.documentType] ?? doc.documentType}</Badge>
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
            Besoins utilisateur
          </p>
          {doc.userStories.map((us, index) => (
            <div
              key={us.id}
              className="rounded-[var(--radius-md)] border border-border bg-background/60 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-accent">#{index + 1}</span>
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
                  {us.acceptanceCriteria.map((criterion, i) => (
                    <p key={i} className="pl-2 text-muted leading-relaxed">
                      {i + 1}. {criterion}
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
            Risques identifiés
          </p>
          {doc.risks.map((risk, index) => (
            <div
              key={risk.id}
              className="rounded-[var(--radius-md)] border border-border bg-background/60 p-3 text-xs space-y-1"
            >
              <p className="font-mono text-accent">Risque {index + 1}</p>
              <p className="font-medium">{risk.description}</p>
              <p className="text-muted">
                Probabilité {LEVEL_LABELS[risk.probability]} — Impact {LEVEL_LABELS[risk.impact]}
              </p>
              <p className="text-muted leading-relaxed">Solution : {risk.mitigation}</p>
            </div>
          ))}
        </div>
      )}

      {exportable && onExport && (
        <Button size="sm" onClick={onExport} loading={exporting} className="w-full sm:w-auto">
          <FolderPlus className="h-4 w-4" />
          Créer le projet avec ces besoins
        </Button>
      )}
    </div>
  );
}
