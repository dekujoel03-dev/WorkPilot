import type {
  TASK_PRIORITIES,
  PROJECT_HEALTH,
  WORKSPACE_ROLES,
  NOTIFICATION_CHANNELS,
} from '../constants';

export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type ProjectHealth = (typeof PROJECT_HEALTH)[number];
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  cursor?: string | null;
  hasMore: boolean;
  total?: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  workspaceId?: string;
  role?: WorkspaceRole;
}
