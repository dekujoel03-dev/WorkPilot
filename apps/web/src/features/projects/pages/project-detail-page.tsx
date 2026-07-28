import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Archive, ArchiveRestore, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProject, useProjectTasks, useCreateProjectList, useUpdateProject } from '../hooks/use-projects';
import { KanbanBoard } from '../components/kanban-board';
import { TaskDetailPanel } from '@/features/tasks/components/task-detail-panel';
import { ProjectAIBreakdown } from '@/features/ai/components/project-ai-breakdown';
import { ShareProjectPanel } from '../components/share-project-panel';
import type { Task } from '@work-pilot/shared';

interface ProjectImportState {
  importedFromAssistant?: boolean;
  importedCount?: number;
  openTaskId?: string;
  taskId?: string;
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const location = useLocation();
  const navState = (location.state as ProjectImportState | null) ?? {};
  const taskIdFromNav = navState.openTaskId ?? navState.taskId;
  const { data: projectData, isLoading: projectLoading } = useProject(projectId);
  const { data: tasksData, isLoading: tasksLoading } = useProjectTasks(projectId);
  const createList = useCreateProjectList(projectId);
  const updateProject = useUpdateProject(projectId);
  const [showListForm, setShowListForm] = useState(false);
  const [listName, setListName] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [importBannerDismissed, setImportBannerDismissed] = useState(false);

  const project = projectData?.data;
  const tasks = tasksData?.data ?? [];
  const lists = project?.lists ?? [];

  useEffect(() => {
    if (taskIdFromNav && tasksData?.data?.length) {
      const task = tasksData.data.find((t) => t.id === taskIdFromNav);
      if (task) setSelectedTask(task);
    }
  }, [taskIdFromNav, tasksData?.data]);

  const showImportBanner =
    navState.importedFromAssistant && !importBannerDismissed && (navState.importedCount ?? 0) > 0;

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;
    await createList.mutateAsync(listName.trim());
    setListName('');
    setShowListForm(false);
  };

  if (projectLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-surface-hover animate-pulse rounded mb-4" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-72 h-96 bg-surface-hover animate-pulse rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted">Projet introuvable</p>
        <Link to="/app/projects">
          <Button variant="ghost" className="mt-4">
            Retour aux projets
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] max-md:h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] min-h-0">
      <div className="px-6 md:px-8 py-4 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/app/projects"
              className="p-1.5 rounded-[var(--radius-md)] text-muted hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div
              className="h-8 w-8 rounded-[var(--radius-md)] shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">{project.name}</h1>
              <p className="text-xs text-muted">
                {project.progress}% · {project._count?.tasks ?? tasks.length} tâches
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ShareProjectPanel projectId={projectId} />
            <Button
              size="sm"
              variant="ghost"
              loading={updateProject.isPending}
              onClick={() =>
                updateProject.mutate({ archived: !project.archived })
              }
            >
              {project.archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Restaurer
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Archiver
                </>
              )}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowListForm(true)}>
              <Plus className="h-4 w-4" />
              Colonne
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <ProjectAIBreakdown projectId={projectId} backlogListId={lists[0]?.id} />
        </div>

        {showListForm && (
          <form onSubmit={handleCreateList} className="flex gap-2 mt-4 max-w-md">
            <Input
              placeholder="Nom de la colonne"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              autoFocus
              className="h-8"
            />
            <Button type="submit" size="sm" loading={createList.isPending}>
              Ajouter
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowListForm(false)}>
              Annuler
            </Button>
          </form>
        )}

        {showImportBanner && (
          <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
            <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">
                {navState.importedCount === 1
                  ? '1 User Story importée depuis le Copilote PM'
                  : `${navState.importedCount} User Stories importées depuis le Copilote PM`}
              </p>
              <p className="text-muted text-xs mt-1">
                Les tâches sont dans « À faire ». Cliquez sur une carte pour modifier le titre, la
                description ou les critères d&apos;acceptation.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="shrink-0 h-7 text-xs"
              onClick={() => setImportBannerDismissed(true)}
            >
              OK
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-6 md:px-8 pb-8">
        {tasksLoading ? (
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-72 h-96 bg-surface-hover animate-pulse rounded-[var(--radius-lg)]" />
            ))}
          </div>
        ) : (
          <KanbanBoard
            projectId={projectId}
            lists={lists}
            tasks={tasks}
            onTaskClick={setSelectedTask}
            onTaskDeleted={(taskId) => {
              if (selectedTask?.id === taskId) setSelectedTask(null);
            }}
          />
        )}
      </div>

      <TaskDetailPanel
        task={selectedTask}
        projectId={projectId}
        onClose={() => setSelectedTask(null)}
        onTaskChange={setSelectedTask}
      />
    </div>
  );
}
