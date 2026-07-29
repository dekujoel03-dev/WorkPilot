import { api } from '@/lib/api';
import { workspacePath } from '@/lib/api-path';
import type { CalendarEvent, CreateMeetingInput, MeetingItem, UpdateMeetingInput } from '@work-pilot/shared';

export const calendarApi = {
  events: (workspaceId: string, from: string, to: string) => {
    const params = new URLSearchParams({ from, to });
    return api<{ data: CalendarEvent[] }>(`${workspacePath(workspaceId)}/calendar/events?${params}`);
  },

  upcomingMeetings: (workspaceId: string) =>
    api<{ data: MeetingItem[] }>(`${workspacePath(workspaceId)}/calendar/meetings/upcoming`),

  archivedMeetings: (workspaceId: string) =>
    api<{ data: MeetingItem[] }>(`${workspacePath(workspaceId)}/calendar/meetings/archive`),

  createMeeting: (workspaceId: string, input: CreateMeetingInput) =>
    api<{ data: unknown }>(`${workspacePath(workspaceId)}/calendar/meetings`, {
      method: 'POST',
      body: input,
    }),

  updateMeeting: (workspaceId: string, meetingId: string, input: UpdateMeetingInput) =>
    api<{ data: MeetingItem }>(`${workspacePath(workspaceId)}/calendar/meetings/${meetingId}`, {
      method: 'PATCH',
      body: input,
    }),

  deleteMeeting: (workspaceId: string, meetingId: string) =>
    api<{ data: { id: string } }>(`${workspacePath(workspaceId)}/calendar/meetings/${meetingId}`, {
      method: 'DELETE',
    }),
};
