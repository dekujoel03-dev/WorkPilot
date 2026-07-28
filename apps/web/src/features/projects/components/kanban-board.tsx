import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import type { ProjectList, Task } from '@work-pilot/shared';
import { KanbanColumn } from './kanban-column';
import { TaskCardPreview } from '@/features/tasks/components/task-card-preview';
import { useCreateTask, useMoveTask, useDeleteTask } from '../hooks/use-projects';
import { toast } from '@/stores/toast.store';

interface KanbanBoardProps {
  projectId: string;
  lists: ProjectList[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function KanbanBoard({
  projectId,
  lists,
  tasks,
  onTaskClick,
  onTaskDeleted,
}: KanbanBoardProps) {
  const createTask = useCreateTask(projectId);
  const moveTask = useMoveTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByList = useMemo(() => {
    const map = new Map<string, Task[]>();
    const firstListId = lists[0]?.id;
    for (const list of lists) {
      map.set(
        list.id,
        tasks
          .filter(
            (t) =>
              t.listId === list.id ||
              (!t.listId && list.id === firstListId),
          )
          .sort((a, b) => a.position - b.position),
      );
    }
    return map;
  }, [lists, tasks]);

  const handleAddTask = (listId: string, title: string) => {
    createTask.mutate({ title, listId });
  };

  const handleDeleteTask = async (task: Task) => {
    const confirmed = window.confirm(
      `Supprimer la tâche « ${task.title} » ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    setDeletingTaskId(task.id);
    try {
      await deleteTask.mutateAsync(task.id);
      onTaskDeleted?.(task.id);
      toast('Tâche supprimée', 'success');
    } catch {
      toast('Impossible de supprimer la tâche', 'error');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let targetListId: string;
    let targetPosition: number;

    if (over.data.current?.type === 'column') {
      targetListId = over.data.current.listId as string;
      targetPosition = (tasksByList.get(targetListId)?.length ?? 0);
    } else if (over.data.current?.type === 'task') {
      targetListId = over.data.current.listId as string;
      const listTasks = tasksByList.get(targetListId) ?? [];
      targetPosition = listTasks.findIndex((t) => t.id === over.id);
      if (targetPosition === -1) targetPosition = listTasks.length;
    } else {
      return;
    }

    if (task.listId === targetListId && task.position === targetPosition) return;

    moveTask.mutate({ taskId, input: { listId: targetListId, position: targetPosition } });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 items-start w-max min-w-full pb-2 px-1">
        {lists.map((list, index) => (
          <KanbanColumn
            key={list.id}
            list={list}
            index={index}
            tasks={tasksByList.get(list.id) ?? []}
            onAddTask={handleAddTask}
            isAdding={createTask.isPending}
            onTaskClick={onTaskClick}
            onTaskDelete={handleDeleteTask}
            deletingTaskId={deletingTaskId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-72 rotate-2 opacity-90">
            <TaskCardPreview task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
