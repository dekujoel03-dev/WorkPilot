import { api } from '@/lib/api';
import type { DashboardStats } from '@work-pilot/shared';

function ws(workspaceId: string) {
  return `/workspaces/${workspaceId}`;
}

export const dashboardApi = {
  stats: (workspaceId: string) =>
    api<{ data: DashboardStats }>(`${ws(workspaceId)}/dashboard/stats`),
};
