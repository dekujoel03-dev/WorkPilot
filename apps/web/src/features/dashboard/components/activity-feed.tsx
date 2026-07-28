import { motion } from 'framer-motion';
import {
  Activity as ActivityIcon,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  UserPlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaceActivities } from '../hooks/use-dashboard';
import type { ActivityAction } from '@work-pilot/shared';

const ACTION_LABELS: Record<ActivityAction, string> = {
  CREATED: 'a créé',
  UPDATED: 'a modifié',
  DELETED: 'a supprimé',
  ASSIGNED: 'a assigné',
  COMMENTED: 'a commenté',
  STATUS_CHANGED: 'a changé le statut de',
  COMPLETED: 'a terminé',
};

const ENTITY_ICONS: Record<string, typeof ActivityIcon> = {
  TASK: CheckSquare,
  PROJECT: FolderKanban,
  COMMENT: MessageSquare,
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export function ActivityFeed() {
  const { data, isLoading } = useWorkspaceActivities();
  const activities = (data?.data ?? []).slice(0, 12);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-display">
            <ActivityIcon className="h-4 w-4 text-accent" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && activities.length === 0 && (
            <p className="text-sm text-muted py-8 text-center">Aucune activité récente</p>
          )}

          <ul className="space-y-1">
            {activities.map((activity) => {
              const userName = activity.user
                ? `${activity.user.firstName} ${activity.user.lastName}`
                : 'Quelqu\'un';
              const EntityIcon = ENTITY_ICONS[activity.entityType] ?? UserPlus;
              const actionLabel = ACTION_LABELS[activity.action] ?? activity.action.toLowerCase();
              const title =
                typeof activity.metadata?.title === 'string'
                  ? activity.metadata.title
                  : activity.entityType.toLowerCase();

              return (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 text-sm p-3 rounded-[var(--radius-lg)] hover:bg-surface-hover transition-colors"
                >
                  {activity.user ? (
                    <Avatar
                      firstName={activity.user.firstName}
                      lastName={activity.user.lastName}
                      size="sm"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
                      <EntityIcon className="h-3.5 w-3.5 text-muted" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground leading-snug">
                      <span className="font-medium">{userName}</span>{' '}
                      <span className="text-muted">{actionLabel}</span>{' '}
                      <span className="font-medium">{title}</span>
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                  </div>
                  <EntityIcon className="h-3.5 w-3.5 text-muted/50 shrink-0 mt-1" />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
