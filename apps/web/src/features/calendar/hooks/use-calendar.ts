import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/calendar.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';
import type { CreateMeetingInput } from '@work-pilot/shared';

function monthRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useCalendarEvents(month: Date) {
  const workspaceId = useWorkspaceId();
  const range = monthRange(month);

  return useQuery({
    queryKey: ['calendar-events', workspaceId, range.from],
    queryFn: () => calendarApi.events(workspaceId!, range.from, range.to),
    enabled: !!workspaceId,
  });
}

export function useCreateMeeting() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMeetingInput) => calendarApi.createMeeting(workspaceId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events', workspaceId] });
    },
  });
}
