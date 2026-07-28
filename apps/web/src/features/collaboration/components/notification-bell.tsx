import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useAcceptInvite } from '@/features/team/hooks/use-team';
import { useSwitchWorkspace } from '@/features/team/hooks/use-workspace-switch';
import type { Notification } from '@work-pilot/shared';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/use-notifications';

function NotificationActions({
  notification,
  onDone,
}: {
  notification: Notification;
  onDone: () => void;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const workspace = useAuthStore((s) => s.workspace);
  const setAuth = useAuthStore((s) => s.setAuth);
  const acceptInvite = useAcceptInvite();
  const switchWs = useSwitchWorkspace();
  const markRead = useMarkNotificationRead();

  if (notification.type === 'WORKSPACE_INVITE') {
    const token = notification.data.inviteToken as string | undefined;
    const role = notification.data.role as string | undefined;
    if (!token) return null;

    return (
      <Button
        size="sm"
        className="mt-2"
        loading={acceptInvite.isPending}
        onClick={async (e) => {
          e.stopPropagation();
          if (!user) return;
          const result = await acceptInvite.mutateAsync(token);
          setAuth({
            user,
            workspace: { ...result.data.workspace, role },
            tokens: result.data.tokens,
          });
          markRead.mutate(notification.id);
          onDone();
          navigate('/app');
        }}
      >
        Accepter
      </Button>
    );
  }

  if (notification.type === 'PROJECT_SHARED') {
    const inviteToken = notification.data.inviteToken as string | undefined;
    const workspaceId = notification.data.workspaceId as string | undefined;
    const projectId = notification.data.projectId as string | undefined;
    const role = notification.data.role as string | undefined;

    if (inviteToken) {
      return (
        <Button
          size="sm"
          className="mt-2"
          loading={acceptInvite.isPending}
          onClick={async (e) => {
            e.stopPropagation();
            if (!user) return;
            const result = await acceptInvite.mutateAsync(inviteToken);
            setAuth({
              user,
              workspace: { ...result.data.workspace, role },
              tokens: result.data.tokens,
            });
            markRead.mutate(notification.id);
            onDone();
            navigate(projectId ? `/app/projects/${projectId}` : '/app');
          }}
        >
          Accepter
        </Button>
      );
    }

    if (!workspaceId || !projectId) return null;

    return (
      <Button
        size="sm"
        variant="secondary"
        className="mt-2"
        loading={switchWs.isPending}
        onClick={async (e) => {
          e.stopPropagation();
          markRead.mutate(notification.id);
          if (workspace?.id !== workspaceId) {
            await switchWs.mutateAsync(workspaceId);
          }
          onDone();
          navigate(`/app/projects/${projectId}`);
        }}
      >
        Ouvrir le projet
      </Button>
    );
  }

  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = unreadData?.data.count ?? 0;
  const notifications = notificationsData?.data ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-md)] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Tout lire
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Aucune notification</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !n.read) markRead.mutate(n.id);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer',
                    !n.read && 'bg-accent/5',
                  )}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <NotificationActions notification={n} onDone={() => setOpen(false)} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
