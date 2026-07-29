import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
import type { Comment, Attachment, Activity, Notification, CreateCommentInput } from '@work-pilot/shared';
import { parseUploadError } from './upload-error';

export const commentsApi = {
  list: (workspaceId: string, taskId: string) =>
    api<{ data: Comment[] }>(`${workspacePath(workspaceId)}/tasks/${taskId}/comments`),

  create: (workspaceId: string, taskId: string, input: CreateCommentInput) =>
    api<{ data: Comment }>(`${workspacePath(workspaceId)}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: input,
    }),
};

export const attachmentsApi = {
  list: (workspaceId: string, taskId: string) =>
    api<{ data: Attachment[] }>(`${workspacePath(workspaceId)}/tasks/${taskId}/attachments`),

  upload: async (workspaceId: string, taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/v1${workspacePath(workspaceId)}/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(parseUploadError(data));
    return data as { data: Attachment };
  },

  listForMeeting: (workspaceId: string, meetingId: string) =>
    api<{ data: Attachment[] }>(
      `${workspacePath(workspaceId)}/calendar/meetings/${meetingId}/attachments`,
    ),

  uploadForMeeting: async (workspaceId: string, meetingId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `/api/v1${workspacePath(workspaceId)}/calendar/meetings/${meetingId}/attachments`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      },
    );

    const data = await response.json();
    if (!response.ok) throw new Error(parseUploadError(data));
    return data as { data: Attachment };
  },
};

export const activitiesApi = {
  byTask: (workspaceId: string, taskId: string) =>
    api<{ data: Activity[] }>(`${workspacePath(workspaceId)}/activities/tasks/${taskId}`),

  byWorkspace: (workspaceId: string) =>
    api<{ data: Activity[] }>(`${workspacePath(workspaceId)}/activities`),
};

export const notificationsApi = {
  list: () => api<{ data: Notification[] }>('/notifications'),

  unreadCount: () => api<{ data: { count: number } }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api<{ data: { success: boolean } }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllAsRead: () =>
    api<{ data: { success: boolean } }>('/notifications/read-all', { method: 'PATCH' }),
};
