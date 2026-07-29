import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Clock, MessageSquare, Activity, Save } from 'lucide-react';
import type { Task, TaskPriority } from '@work-pilot/shared';
import { TASK_PRIORITIES } from '@work-pilot/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PriorityBadge, formatDueDate, isTaskCompleted } from './task-utils';
import { cn } from '@/lib/utils';
import {
  useComments,
  useCreateComment,
  useAttachments,
  useUploadAttachment,
  useTaskActivities,
} from '@/features/collaboration/hooks/use-collaboration';
import { useUpdateTask, useTaskStatuses } from '@/features/projects/hooks/use-projects';
import { toast } from '@/stores/toast.store';
import { Avatar } from '@/components/ui/avatar';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
  NONE: 'Aucune',
};

interface TaskDetailPanelProps {
  task: Task | null;
  projectId: string;
  onClose: () => void;
  onTaskChange?: (task: Task) => void;
}

type Tab = 'details' | 'comments' | 'attachments' | 'activity';

export function TaskDetailPanel({ task, projectId, onClose, onTaskChange }: TaskDetailPanelProps) {
  const [tab, setTab] = useState<Tab>('details');
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('NONE');
  const [statusId, setStatusId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dirty, setDirty] = useState(false);

  const { data: statusesData } = useTaskStatuses();
  const updateTask = useUpdateTask(projectId);
  const { data: commentsData } = useComments(task?.id ?? null);
  const { data: attachmentsData } = useAttachments(task?.id ?? null);
  const { data: activitiesData } = useTaskActivities(task?.id ?? null);
  const createComment = useCreateComment(task?.id ?? '');
  const uploadAttachment = useUploadAttachment(task?.id ?? '');

  const statuses = statusesData?.data ?? [];
  const comments = commentsData?.data ?? [];
  const attachments = attachmentsData?.data ?? [];
  const activities = activitiesData?.data ?? [];
  const due = task
    ? formatDueDate(task.dueDate, { isCompleted: isTaskCompleted(task) })
    : null;

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setStatusId(task.statusId ?? '');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setDirty(false);
    setTab('details');
  }, [task?.id]);

  const handleSave = async () => {
    if (!task || !dirty) return;
    const result = await updateTask.mutateAsync({
      taskId: task.id,
      input: {
        title: title.trim() || task.title,
        description: description.trim() || undefined,
        priority,
        statusId: statusId || null,
        dueDate: dueDate || null,
      },
    });
    onTaskChange?.(result.data);
    setDirty(false);
    toast('Tâche enregistrée', 'success');
  };

  const handleStatusChange = async (nextStatusId: string) => {
    if (!task || nextStatusId === (task.statusId ?? '')) return;
    setStatusId(nextStatusId);

    try {
      const result = await updateTask.mutateAsync({
        taskId: task.id,
        input: { statusId: nextStatusId || null },
      });
      onTaskChange?.(result.data);
      toast('Statut mis à jour', 'success');
    } catch {
      setStatusId(task.statusId ?? '');
      toast('Impossible de mettre à jour le statut', 'error');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !task) return;
    await createComment.mutateAsync({ content: comment.trim() });
    setComment('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && task) uploadAttachment.mutate(file);
    e.target.value = '';
  };

  const tabs = [
    { id: 'details' as const, label: 'Détails', icon: Activity, count: 0 },
    { id: 'comments' as const, label: 'Commentaires', icon: MessageSquare, count: comments.length },
    { id: 'attachments' as const, label: 'Fichiers', icon: Paperclip, count: attachments.length },
    { id: 'activity' as const, label: 'Activité', icon: Clock, count: activities.length },
  ];

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-elevated border-l border-border shadow-[var(--shadow-lg)] z-50 flex flex-col"
          >
            <div className="p-6 border-b border-border bg-surface-sunken/30">
              <div className="flex items-start justify-between gap-3 mb-4">
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                  className="text-lg font-semibold font-display border-transparent bg-transparent px-0 h-auto focus-visible:ring-0 shadow-none"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-[var(--radius-md)] text-muted hover:text-foreground hover:bg-surface-hover shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <PriorityBadge priority={task.priority} />
                {due && (
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full bg-surface', due.className)}>
                    {due.label}
                  </span>
                )}
                {task.status && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${task.status.color}18`, color: task.status.color }}
                  >
                    {task.status.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex border-b border-border px-2 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                    tab === t.id
                      ? 'border-accent text-foreground'
                      : 'border-transparent text-muted hover:text-foreground',
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {t.count > 0 && (
                    <span className="text-xs bg-surface-hover px-1.5 rounded-full">{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'details' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Priorité"
                      value={priority}
                      onChange={(e) => {
                        setPriority(e.target.value as TaskPriority);
                        setDirty(true);
                      }}
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Échéance"
                      type="date"
                      value={dueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        setDirty(true);
                      }}
                    />
                  </div>
                  {statuses.length > 0 && (
                    <Select
                      label="Statut"
                      value={statusId}
                      onChange={(e) => void handleStatusChange(e.target.value)}
                      disabled={updateTask.isPending}
                    >
                      <option value="">— Aucun —</option>
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setDirty(true);
                      }}
                      rows={5}
                      placeholder="Ajouter une description…"
                      className="w-full rounded-[var(--radius-lg)] border border-border bg-surface-sunken/50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-shadow"
                    />
                  </div>
                  {dirty && (
                    <Button
                      className="w-full"
                      onClick={handleSave}
                      loading={updateTask.isPending}
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer les modifications
                    </Button>
                  )}
                </div>
              )}

              {tab === 'comments' && (
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted text-center py-8">Aucun commentaire</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        {c.user ? (
                          <Avatar firstName={c.user.firstName} lastName={c.user.lastName} size="sm" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-surface-hover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium">
                              {c.user?.firstName} {c.user?.lastName}
                            </span>
                            <span className="text-xs text-muted">
                              {new Date(c.createdAt).toLocaleString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'attachments' && (
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-[var(--radius-lg)] cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-colors">
                    <Paperclip className="h-4 w-4 text-muted" />
                    <span className="text-sm text-muted">
                      {uploadAttachment.isPending ? 'Upload…' : 'Ajouter un fichier (max 10 Mo)'}
                    </span>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </label>
                  {attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-border hover:border-accent/30 transition-colors"
                    >
                      <Paperclip className="h-4 w-4 text-muted shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted">{(a.size / 1024).toFixed(1)} Ko</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {tab === 'activity' && (
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted text-center py-8">Aucune activité</p>
                  ) : (
                    activities.map((a) => (
                      <div key={a.id} className="flex gap-3 text-sm">
                        <Clock className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                        <div>
                          <p>
                            <span className="font-medium">
                              {a.user?.firstName} {a.user?.lastName}
                            </span>{' '}
                            <span className="text-muted">{formatActivityAction(a.action, a.entityType)}</span>
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {new Date(a.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {tab === 'comments' && (
              <form onSubmit={handleSubmitComment} className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Écrire un commentaire…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" loading={createComment.isPending} disabled={!comment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function formatActivityAction(action: string, entityType: string): string {
  const labels: Record<string, string> = {
    'COMMENTED-COMMENT': 'a commenté',
    'CREATED-ATTACHMENT': 'a ajouté une pièce jointe',
    'CREATED-TASK': 'a créé une tâche',
    'UPDATED-TASK': 'a modifié une tâche',
    'COMPLETED-TASK': 'a terminé une tâche',
  };
  return labels[`${action}-${entityType}`] ?? `${action.toLowerCase()} (${entityType.toLowerCase()})`;
}
