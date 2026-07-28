import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@work-pilot/shared';
import { cn } from '@/lib/utils';
import { PriorityBadge, DueDateBadge, PRIORITY_BORDER } from './task-utils';
import { GripVertical, MessageSquare, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: (task: Task) => void;
  isDeleting?: boolean;
}

export function TaskCard({ task, onClick, onDelete, isDeleting }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task, listId: task.listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const commentCount = task._count?.comments ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-[var(--radius-md)] border border-border bg-surface-elevated border-l-[3px] p-3 shadow-[var(--shadow-sm)]',
        PRIORITY_BORDER[task.priority],
        'hover:border-accent/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        isDragging && 'opacity-60 shadow-[var(--shadow-lg)] rotate-1 scale-105 z-50',
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 p-0.5 text-muted-foreground/30 hover:text-muted cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-start gap-1.5">
            <p className="text-sm font-medium leading-snug text-foreground flex-1 min-w-0 break-words">
              {task.title}
            </p>
            {onDelete && (
              <button
                type="button"
                title="Supprimer la tâche"
                disabled={isDeleting}
                className="shrink-0 p-1 rounded-[var(--radius-sm)] text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <PriorityBadge priority={task.priority} />
            {task.status && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${task.status.color}15`,
                  color: task.status.color,
                  borderColor: `${task.status.color}30`,
                }}
              >
                {task.status.name}
              </span>
            )}
            <DueDateBadge date={task.dueDate} />
          </div>
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
