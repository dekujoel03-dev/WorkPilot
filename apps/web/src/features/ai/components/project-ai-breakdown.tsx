import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBreakdownProject } from '../hooks/use-ai';
import { useCreateTask } from '@/features/projects/hooks/use-projects';
import type { AIJob, SuggestedTask } from '@work-pilot/shared';
import { parseProjectBreakdownOutput } from '@work-pilot/shared';
import { useState } from 'react';

interface ProjectAIBreakdownProps {
  projectId: string;
  backlogListId?: string;
}

export function ProjectAIBreakdown({ projectId, backlogListId }: ProjectAIBreakdownProps) {
  const breakdown = useBreakdownProject();
  const createTask = useCreateTask(projectId);
  const [job, setJob] = useState<AIJob | null>(null);
  const [applied, setApplied] = useState(false);

  const output = parseProjectBreakdownOutput(job?.output ?? null);
  const tasks = output?.suggestedTasks ?? [];

  const handleBreakdown = async () => {
    setApplied(false);
    const result = await breakdown.mutateAsync(projectId);
    setJob(result.data);
  };

  const handleApplyTasks = async () => {
    for (const task of tasks) {
      await createTask.mutateAsync({
        title: task.title,
        description: task.description,
        priority: task.priority,
        listId: backlogListId,
      });
    }
    setApplied(true);
  };

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        variant="secondary"
        onClick={handleBreakdown}
        loading={breakdown.isPending}
      >
        <Sparkles className="h-4 w-4" />
        Proposer un plan de tâches
      </Button>

      {output && (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 space-y-3">
          <p className="text-sm text-muted">{output.summary}</p>
          <ul className="space-y-2">
            {tasks.map((task: SuggestedTask, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted">{task.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {tasks.length > 0 && !applied && (
            <Button size="sm" onClick={handleApplyTasks} loading={createTask.isPending}>
              Créer {tasks.length} tâches
            </Button>
          )}
          {applied && (
            <p className="text-xs text-success">Tâches créées avec succès</p>
          )}
        </div>
      )}
    </div>
  );
}
