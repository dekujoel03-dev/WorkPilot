import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { Comment, Attachment, Activity, Notification, CreateCommentInput } from '@work-pilot/shared';

function ws(workspaceId: string) {
  return `/workspaces/${workspaceId}`;
}

export const commentsApi = {
  list: (workspaceId: string, taskId: string) =>
    api<{ data: Comment[] }>(`${ws(workspaceId)}/tasks/${taskId}/comments`),

  create: (workspaceId: string, taskId: string, input: CreateCommentInput) =>
    api<{ data: Comment }>(`${ws(workspaceId)}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: input,
    }),

  remove: (workspaceId: string, taskId: string, commentId: string) =>
    api<{ data: { success: boolean } }>(
      `${ws(workspaceId)}/tasks/${taskId}/comments/${commentId}`,
      { method: 'DELETE' },
    ),
};

export const attachmentsApi = {
  list: (workspaceId: string, taskId: string) =>
    api<{ data: Attachment[] }>(`${ws(workspaceId)}/tasks/${taskId}/attachments`),

  upload: async (workspaceId: string, taskId: string, file: File) => {
    const token = useAuthStore.getState().accessToken;
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/v1${ws(workspaceId)}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.message ?? 'Upload échoué');
    return data as { data: Attachment };
  },
};

export const activitiesApi = {
  byTask: (workspaceId: string, taskId: string) =>
    api<{ data: Activity[] }>(`${ws(workspaceId)}/activities/tasks/${taskId}`),

  byWorkspace: (workspaceId: string) =>
    api<{ data: Activity[] }>(`${ws(workspaceId)}/activities`),
};

export const notificationsApi = {
  list: () => api<{ data: Notification[] }>('/notifications'),

  unreadCount: () => api<{ data: { count: number } }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api<{ data: { success: boolean } }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllAsRead: () =>
    api<{ data: { success: boolean } }>('/notifications/read-all', { method: 'PATCH' }),
};
