import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, MapPin, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useAcceptInvite } from '@/features/team/hooks/use-team';
import { useSwitchWorkspace } from '@/features/team/hooks/use-workspace-switch';
import type { Notification, MeetingItem } from '@work-pilot/shared';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/use-notifications';
import { useUpcomingMeetings } from '@/features/calendar/hooks/use-calendar';

function isMeetingLink(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function getMeetingLocationLabel(location: string) {
  if (!isMeetingLink(location)) return location.trim();
  try {
    return new URL(location.trim()).hostname.replace(/^www\./, '');
  } catch {
    return 'Lien visio';
  }
}

function formatMeetingTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMeetingReminderTitle(notification: Notification, liveMeeting?: MeetingItem) {
  const startIso =
    liveMeeting?.startTime ?? (notification.data.startTime as string | undefined);
  if (!startIso) return notification.title;

  const minutes = Math.max(
    1,
    Math.ceil(
      (new Date(startIso).getTime() - new Date(notification.createdAt).getTime()) / 60_000,
    ),
  );

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `Réunion dans ${hours} h`;
    return `Réunion dans ${hours} h ${remainder} min`;
  }

  return minutes === 1 ? 'Réunion dans 1 minute' : `Réunion dans ${minutes} minutes`;
}

function formatMeetingReminderBody(notification: Notification, liveMeeting?: MeetingItem) {
  const meetingTitle =
    liveMeeting?.title ?? (notification.data.meetingTitle as string | undefined);
  const startTime =
    liveMeeting?.startTime ?? (notification.data.startTime as string | undefined);
  const title = meetingTitle?.trim() || notification.body.match(/«([^»]+)»/)?.[1]?.trim();
  const timeLabel = startTime ? formatMeetingTime(startTime) : null;

  if (title && timeLabel) {
    return `« ${title} » commence à ${timeLabel}.`;
  }

  return notification.body;
}

function getLiveMeetingLocation(notification: Notification, liveMeeting?: MeetingItem) {
  const location =
    liveMeeting?.location ?? (notification.data.location as string | null | undefined);
  return location?.trim() || null;
}

function MeetingReminderDetails({
  notification,
  liveMeeting,
}: {
  notification: Notification;
  liveMeeting?: MeetingItem;
}) {
  const location = getLiveMeetingLocation(notification, liveMeeting);
  const meetingUrl =
    (notification.data.meetingUrl as string | null | undefined) ??
    (location && isMeetingLink(location) ? location : null);
  const trimmedLocation = location;

  if (!trimmedLocation) return null;

  if (meetingUrl) {
    return (
      <p className="text-xs mt-1.5 flex items-start gap-1.5 text-foreground">
        <Video className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          Rejoindre · {getMeetingLocationLabel(trimmedLocation)}
        </a>
      </p>
    );
  }

  return (
    <p className="text-xs mt-1.5 flex items-start gap-1.5 text-foreground">
      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted" />
      <span>Lieu : {trimmedLocation}</span>
    </p>
  );
}

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
  const setSession = useAuthStore((s) => s.setSession);
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
          setSession({
            user,
            workspace: { ...result.data.workspace, role },
            accessToken: result.data.tokens.accessToken,
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
            setSession({
              user,
              workspace: { ...result.data.workspace, role },
              accessToken: result.data.tokens.accessToken,
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

  if (notification.type === 'MEETING_REMINDER') {
    const location = notification.data.location as string | null | undefined;
    const meetingUrl =
      (notification.data.meetingUrl as string | null | undefined) ??
      (location && isMeetingLink(location) ? location.trim() : null);

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {meetingUrl && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              markRead.mutate(notification.id);
              window.open(meetingUrl, '_blank', 'noopener,noreferrer');
              onDone();
            }}
          >
            Rejoindre la visio
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            markRead.mutate(notification.id);
            onDone();
            navigate('/app/calendar');
          }}
        >
          Voir le calendrier
        </Button>
      </div>
    );
  }

  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData } = useNotifications();
  const { data: upcomingMeetingsData } = useUpcomingMeetings();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = unreadData?.data.count ?? 0;
  const notifications = notificationsData?.data ?? [];
  const upcomingMeetings = upcomingMeetingsData?.data ?? [];

  const getLiveMeeting = (meetingId: string | undefined) =>
    meetingId ? upcomingMeetings.find((meeting) => meeting.id === meetingId) : undefined;

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
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-lg)] overflow-hidden">
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
              notifications.map((n) => {
                const meetingId = n.data.meetingId as string | undefined;
                const liveMeeting =
                  n.type === 'MEETING_REMINDER' ? getLiveMeeting(meetingId) : undefined;

                return (
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
                  <p className="text-sm font-medium">
                    {n.type === 'MEETING_REMINDER'
                      ? formatMeetingReminderTitle(n, liveMeeting)
                      : n.title}
                  </p>
                  <p className={cn('text-xs text-muted mt-0.5', n.type !== 'MEETING_REMINDER' && 'line-clamp-2')}>
                    {n.type === 'MEETING_REMINDER'
                      ? formatMeetingReminderBody(n, liveMeeting)
                      : n.body}
                  </p>
                  {n.type === 'MEETING_REMINDER' && (
                    <MeetingReminderDetails notification={n} liveMeeting={liveMeeting} />
                  )}
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
              );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
