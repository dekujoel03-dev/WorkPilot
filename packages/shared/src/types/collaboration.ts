import type { NotificationChannel } from './index';

export type EntityType = 'TASK' | 'PROJECT' | 'COMMENT' | 'SPRINT' | 'DOCUMENT' | 'ATTACHMENT';
export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'ASSIGNED'
  | 'COMMENTED'
  | 'STATUS_CHANGED'
  | 'COMPLETED';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_DUE'
  | 'TASK_OVERDUE'
  | 'COMMENT_MENTION'
  | 'PROJECT_UPDATE'
  | 'REMINDER'
  | 'DAILY_BRIEF'
  | 'COMMENT_ADDED'
  | 'ATTACHMENT_ADDED'
  | 'WORKSPACE_INVITE'
  | 'PROJECT_SHARED'
  | 'MEETING_REMINDER';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
}

export interface Attachment {
  id: string;
  taskId: string | null;
  projectId: string | null;
  meetingId: string | null;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
  uploader?: UserSummary;
}

export interface Activity {
  id: string;
  workspaceId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  createdAt: string;
  user?: UserSummary;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channel: NotificationChannel;
  read: boolean;
  createdAt: string;
}

export interface CreateCommentInput {
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface WsEvents {
  'comment.created': { comment: Comment; taskId: string; workspaceId: string };
  'notification.new': { notification: Notification };
  'task.updated': { taskId: string; workspaceId: string };
  'activity.new': { activity: Activity; workspaceId: string };
  'ai.job.completed': { job: import('./ai').AIJob; workspaceId: string };
}
