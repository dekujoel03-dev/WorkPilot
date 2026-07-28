import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ProjectList, Task } from '@work-pilot/shared';
import { TaskCard } from '@/features/tasks/components/task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMN_ACCENT = ['#71717A', '#6366F1', '#22C55E'];

interface KanbanColumnProps {
  list: ProjectList;
  tasks: Task[];
  onAddTask: (listId: string, title: string) => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  deletingTaskId?: string | null;
  isAdding?: boolean;
  index?: number;
}

export function KanbanColumn({
  list,
  tasks,
  onAddTask,
  onTaskClick,
  onTaskDelete,
  deletingTaskId,
  isAdding,
  index = 0,
}: KanbanColumnProps) {
  const [showInput, setShowInput] = useState(false);
  const [title, setTitle] = useState('');
  const accent = COLUMN_ACCENT[index % COLUMN_ACCENT.length];

  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: { type: 'column', listId: list.id },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask(list.id, title.trim());
    setTitle('');
    setShowInput(false);
  };

  return (
    <div
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-[var(--radius-xl)] bg-surface-sunken/80 border border-border/50 transition-all duration-200 self-stretch',
        isOver && 'border-accent/50 bg-accent/5 ring-2 ring-accent/20 scale-[1.01]',
      )}
    >
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: accent }}
          />
          <h3 className="text-sm font-semibold truncate font-display">{list.name}</h3>
          <span className="text-[11px] font-medium text-muted bg-surface px-2 py-0.5 rounded-full shrink-0 tabular-nums">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 px-2 pb-2 space-y-2 min-h-[140px]"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={onTaskDelete}
              isDeleting={deletingTaskId === task.id}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Inbox className="h-8 w-8 text-muted/40 mb-2" />
            <p className="text-xs text-muted">Glissez une tâche ici</p>
          </div>
        )}

        {isOver && tasks.length === 0 && (
          <div className="h-16 rounded-[var(--radius-md)] border-2 border-dashed border-accent/40 bg-accent/5" />
        )}
      </div>

      <div className="p-2 pt-0">
        {showInput ? (
          <form onSubmit={handleSubmit} className="space-y-2 bg-surface rounded-[var(--radius-md)] p-2 border border-border">
            <Input
              placeholder="Titre de la tâche…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={isAdding} className="flex-1">
                Ajouter
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowInput(false)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-muted hover:text-accent hover:bg-surface transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une tâche
          </button>
        )}
      </div>
    </div>
  );
}
