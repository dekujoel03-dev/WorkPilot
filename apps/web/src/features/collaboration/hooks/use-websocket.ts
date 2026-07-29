import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Notification } from '@work-pilot/shared';
import { useAuthStore } from '@/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/stores/toast.store';

export function useWebSocket() {
  const user = useAuthStore((s) => s.user);
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const socket = io('/ws', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('notification.new', (payload?: { notification?: Notification }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });

      const notification = payload?.notification;
      if (notification?.type === 'MEETING_REMINDER') {
        const title = notification.data.meetingTitle as string | undefined;
        const startTime = notification.data.startTime as string | undefined;
        const timeLabel = startTime
          ? new Date(startTime).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;
        const message =
          title && timeLabel
            ? `${notification.title} · « ${title} » à ${timeLabel}`
            : notification.body;
        toast(message, 'info');
      }
    });

    socket.on('comment.created', (_payload: { taskId: string }) => {
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['comments', workspaceId, _payload.taskId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
      }
    });

    socket.on('activity.new', (_payload: { workspaceId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['activities', _payload.workspaceId] });
    });

    socket.on('ai.job.completed', (_payload: { workspaceId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', _payload.workspaceId] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, workspaceId, queryClient]);
}
