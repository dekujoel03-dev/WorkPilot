import type { TaskPriority } from '@work-pilot/shared';
import { Badge, PRIORITY_BADGE, PRIORITY_LABELS } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TaskCompletionInfo = {
  completedAt?: string | null;
  status?: { isDone?: boolean } | null;
};

export function isTaskCompleted(task: TaskCompletionInfo) {
  return Boolean(task.completedAt) || Boolean(task.status?.isDone);
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'NONE') return null;
  return (
    <Badge variant={PRIORITY_BADGE[priority] ?? 'outline'}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function formatDueDate(
  date: string | null,
  options?: { isCompleted?: boolean },
) {
  if (!date || options?.isCompleted) return null;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { label: 'En retard', className: 'text-danger', overdue: true };
  if (diff === 0) return { label: "Aujourd'hui", className: 'text-warning', overdue: false };
  if (diff === 1) return { label: 'Demain', className: 'text-muted', overdue: false };
  return {
    label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    className: 'text-muted',
    overdue: false,
  };
}

export const PRIORITY_BORDER: Record<TaskPriority, string> = {
  URGENT: 'border-l-danger',
  HIGH: 'border-l-warning',
  MEDIUM: 'border-l-accent',
  LOW: 'border-l-border',
  NONE: 'border-l-transparent',
};

export function DueDateBadge({
  date,
  isCompleted = false,
}: {
  date: string | null;
  isCompleted?: boolean;
}) {
  const due = formatDueDate(date, { isCompleted });
  if (!due) return null;
  return (
    <span className={cn('text-[10px] font-medium', due.className, due.overdue && 'font-semibold')}>
      {due.label}
    </span>
  );
}
