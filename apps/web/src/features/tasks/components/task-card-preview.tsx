import type { Task } from '@work-pilot/shared';
import { cn } from '@/lib/utils';
import { PriorityBadge, formatDueDate } from './task-utils';

export function TaskCardPreview({ task }: { task: Task }) {
  const due = formatDueDate(task.dueDate);

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-accent/30 bg-surface p-3 shadow-[var(--shadow-md)]',
      )}
    >
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <PriorityBadge priority={task.priority} />
        {due && <span className={cn('text-[10px]', due.className)}>{due.label}</span>}
      </div>
    </div>
  );
}
