import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
import type { SearchResponse } from '@work-pilot/shared';

export const searchApi = {
  search: (workspaceId: string, q: string, types?: string[]) => {
    const params = new URLSearchParams({ q });
    if (types?.length) params.set('types', types.join(','));
    return api<{ data: SearchResponse }>(`${workspacePath(workspaceId)}/search?${params}`);
  },
};
