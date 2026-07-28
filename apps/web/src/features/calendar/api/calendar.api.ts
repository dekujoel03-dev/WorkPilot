import { api } from '@/lib/api';
import type { CalendarEvent, CreateMeetingInput } from '@work-pilot/shared';

function ws(workspaceId: string) {
  return `/workspaces/${workspaceId}`;
}

export const calendarApi = {
  events: (workspaceId: string, from: string, to: string) => {
    const params = new URLSearchParams({ from, to });
    return api<{ data: CalendarEvent[] }>(`${ws(workspaceId)}/calendar/events?${params}`);
  },

  createMeeting: (workspaceId: string, input: CreateMeetingInput) =>
    api<{ data: unknown }>(`${ws(workspaceId)}/calendar/meetings`, {
      method: 'POST',
      body: input,
    }),
};
