import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io('/ws', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('notification.new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
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
  }, [accessToken, workspaceId, queryClient]);
}
