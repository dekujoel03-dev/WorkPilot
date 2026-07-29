import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
import type { DashboardStats } from '@work-pilot/shared';

export const dashboardApi = {
  stats: (workspaceId: string) =>
    api<{ data: DashboardStats }>(`${workspacePath(workspaceId)}/dashboard/stats`),
};
