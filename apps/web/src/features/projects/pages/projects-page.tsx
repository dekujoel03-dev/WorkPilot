import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, ArrowRight, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, HEALTH_BADGE } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useProjects, useCreateProject } from '../hooks/use-projects';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from '@/lib/api';

export function ProjectsPage() {
  const navigate = useNavigate();
  const workspace = useAuthStore((s) => s.workspace);
  const [showArchived, setShowArchived] = useState(false);
  const { data, isLoading } = useProjects(showArchived ? 'true' : undefined);
  const createProject = useCreateProject();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const projects = data?.data ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!workspace?.id) {
      setError('Aucun workspace actif. Reconnectez-vous.');
      return;
    }

    setError('');
    try {
      const result = await createProject.mutateAsync({ name: name.trim() });
      setName('');
      setShowForm(false);
      navigate(`/app/projects/${result.data.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Impossible de créer le projet',
      );
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {showArchived ? 'Projets archivés' : 'Projets'}
          </h1>
          <p className="text-muted mt-1 text-sm">
            {showArchived
              ? 'Projets terminés ou mis de côté'
              : 'Gérez vos projets et tableaux Kanban'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!showArchived && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Nouveau projet
            </Button>
          )}
          <Button
            variant={showArchived ? 'secondary' : 'ghost'}
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? 'Actifs' : 'Archivés'}
          </Button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-accent/20 shadow-[var(--shadow-md)]">
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Input
                  placeholder="Nom du projet (min. 2 caractères)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1"
                  minLength={2}
                  autoFocus
                />
                <div className="flex gap-2 shrink-0">
                  <Button type="submit" loading={createProject.isPending}>
                    Créer
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
              {error && (
                <p className="mt-3 text-sm text-danger bg-danger/10 px-3 py-2 rounded-[var(--radius-md)]">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-accent/10 mb-4">
              <FolderKanban className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-semibold text-lg font-display">
              {showArchived ? 'Aucun projet archivé' : 'Aucun projet'}
            </h3>
            <p className="text-muted mt-1 mb-6 text-sm">
              {showArchived
                ? 'Les projets archivés apparaîtront ici'
                : 'Créez votre premier projet pour commencer'}
            </p>
            {!showArchived && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Créer un projet
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => {
            const health = HEALTH_BADGE[project.health ?? 'ON_TRACK'];
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/app/projects/${project.id}`}>
                  <Card className="group h-full hover:border-accent/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden">
                    <div
                      className="h-1 w-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start gap-3">
                        <div
                          className="h-11 w-11 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${project.color}18` }}
                        >
                          <FolderKanban className="h-5 w-5" style={{ color: project.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold truncate font-display group-hover:text-accent transition-colors">
                              {project.name}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted mt-1 line-clamp-2 leading-relaxed">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {health && (
                              <Badge variant={health.variant}>{health.label}</Badge>
                            )}
                            <span className="text-xs text-muted">
                              {project._count?.tasks ?? 0} tâches
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <ProgressBar
                          value={project.progress}
                          className="flex-1"
                          color={project.color}
                        />
                        <span className="text-xs font-semibold tabular-nums text-muted shrink-0">
                          {project.progress}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
