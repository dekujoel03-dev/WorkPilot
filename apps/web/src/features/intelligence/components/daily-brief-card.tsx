import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Calendar, AlertTriangle, Clock, Zap, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, PRIORITY_BADGE, PRIORITY_LABELS } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyBrief, useSyncReminders } from '../hooks/use-intelligence';
import { useEffect } from 'react';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';
import { cn } from '@/lib/utils';
import type { DailyBriefTask } from '@work-pilot/shared';

function projectKanbanPath(task: DailyBriefTask) {
  return `/app/projects/${task.projectId}`;
}

function projectKanbanState(task: DailyBriefTask) {
  return { openTaskId: task.id };
}

export function DailyBriefCard() {
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useDailyBrief();
  const syncReminders = useSyncReminders();
  const brief = data?.data;

  useEffect(() => {
    if (workspaceId) syncReminders.mutate();
  }, [workspaceId]);

  if (isLoading || !brief) {
    return (
      <Card className="border-accent/20 overflow-hidden">
        <CardContent className="py-10 space-y-4">
          <Skeleton className="h-7 w-56" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-[var(--radius-lg)]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-accent/25 overflow-hidden shadow-[var(--shadow-md)]">
        <div className="h-1 bg-gradient-to-r from-accent via-accent-hover to-accent/40" />
        <CardHeader className="pb-3 pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[var(--radius-lg)] bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-xl font-display capitalize">
                {new Date(brief.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </CardTitle>
              <p className="text-sm text-muted mt-0.5">Brief du jour</p>

            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox icon={Zap} label="Critiques" value={brief.criticalTasks.length} accent />
            <StatBox icon={Calendar} label="Réunions" value={brief.meetings.length} />
            <StatBox icon={AlertTriangle} label="Retards" value={brief.overdue.length} warning={brief.overdue.length > 0} />
            <StatBox icon={Clock} label="Estimé" value={`${brief.estimatedHours}h`} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted">
              <span>Charge de travail</span>
              <span className="font-medium tabular-nums">{brief.workloadPercent}% · max {brief.maxDailyHours}h</span>
            </div>
            <ProgressBar
              value={brief.workloadPercent}
              color={brief.workloadPercent >= 100 ? '#d97706' : undefined}
            />
          </div>

          {brief.mainGoal && (
            <Link
              to={projectKanbanPath(brief.mainGoal)}
              state={projectKanbanState(brief.mainGoal)}
              className="flex items-start gap-4 p-4 rounded-[var(--radius-xl)] bg-gradient-to-br from-accent/8 to-transparent border border-accent/20 hover:border-accent/40 hover:bg-accent/10 transition-colors cursor-pointer"
            >
              <Target className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-accent uppercase tracking-wider">Objectif du jour</p>
                <p className="font-semibold mt-1 font-display text-lg leading-snug">{brief.mainGoal.title}</p>
                {brief.mainGoal.projectName && (
                  <p className="text-xs text-muted mt-1">{brief.mainGoal.projectName}</p>
                )}
              </div>
            </Link>
          )}

          {brief.meetings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold font-display">Réunions du jour</p>
              <div className="rounded-[var(--radius-lg)] border border-border divide-y divide-border overflow-hidden">
                {brief.meetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    to="/app/calendar"
                    className="flex items-center justify-between gap-3 text-sm px-4 py-3 bg-surface hover:bg-surface-hover transition-colors"
                  >
                    <span className="truncate font-medium">{meeting.title}</span>
                    <span className="text-xs text-muted shrink-0 tabular-nums">
                      {new Date(meeting.startTime).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {brief.criticalTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold font-display">Tâches critiques</p>
              <div className="rounded-[var(--radius-lg)] border border-border divide-y divide-border overflow-hidden">
                {brief.criticalTasks.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    to={projectKanbanPath(t)}
                    state={projectKanbanState(t)}
                    className="flex items-center justify-between gap-3 text-sm px-4 py-3 bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <span className="truncate font-medium">{t.title}</span>
                    {t.priority !== 'NONE' && (
                      <Badge variant={PRIORITY_BADGE[t.priority] ?? 'outline'}>
                        {PRIORITY_LABELS[t.priority] ?? t.priority}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  accent,
  warning,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border p-3.5',
        accent ? 'border-accent/20 bg-accent/5' : warning ? 'border-warning/30 bg-warning/5' : 'border-border bg-surface-sunken/50',
      )}
    >
      <Icon className={cn('h-4 w-4 mb-2', accent ? 'text-accent' : warning ? 'text-warning' : 'text-muted')} />
      <p className="text-2xl font-bold tabular-nums font-display">{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}
