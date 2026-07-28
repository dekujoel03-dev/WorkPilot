import { api } from '@/lib/api';
import type { SearchResponse } from '@work-pilot/shared';

function ws(workspaceId: string) {
  return `/workspaces/${workspaceId}`;
}

export const searchApi = {
  search: (workspaceId: string, q: string, types?: string[]) => {
    const params = new URLSearchParams({ q });
    if (types?.length) params.set('types', types.join(','));
    return api<{ data: SearchResponse }>(`${ws(workspaceId)}/search?${params}`);
  },
};
