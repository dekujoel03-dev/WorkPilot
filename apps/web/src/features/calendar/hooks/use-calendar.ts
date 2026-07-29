import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { calendarApi } from '../api/calendar.api';
import { useWorkspaceId } from '@/features/projects/hooks/use-projects';
import type { CreateMeetingInput, UpdateMeetingInput } from '@work-pilot/shared';

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

export function useUpcomingMeetings() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: ['meetings-upcoming', workspaceId],
    queryFn: () => calendarApi.upcomingMeetings(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  });
}

export function useArchivedMeetings() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: ['meetings-archive', workspaceId],
    queryFn: () => calendarApi.archivedMeetings(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  });
}

export function useMeetingsLifecycleSync() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data: upcomingData } = useUpcomingMeetings();

  useEffect(() => {
    const upcoming = upcomingData?.data ?? [];
    if (upcoming.length === 0) return;

    const now = Date.now();
    const timers = upcoming
      .map((meeting) => new Date(meeting.endTime).getTime())
      .filter((endMs) => endMs > now)
      .map((endMs) =>
        setTimeout(() => {
          invalidateMeetingQueries(queryClient, workspaceId);
        }, endMs - now + 300),
      );

    return () => timers.forEach(clearTimeout);
  }, [upcomingData?.data, queryClient, workspaceId]);
}

export function useCreateMeeting() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMeetingInput) => calendarApi.createMeeting(workspaceId!, input),
    onSuccess: () => invalidateMeetingQueries(queryClient, workspaceId),
  });
}

function invalidateMeetingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string | null,
) {
  if (!workspaceId) return;
  queryClient.invalidateQueries({ queryKey: ['calendar-events', workspaceId] });
  queryClient.invalidateQueries({ queryKey: ['meetings-upcoming', workspaceId] });
  queryClient.invalidateQueries({ queryKey: ['meetings-archive', workspaceId] });
  queryClient.invalidateQueries({ queryKey: ['daily-brief', workspaceId] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
}

export function useUpdateMeeting() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      meetingId,
      input,
    }: {
      meetingId: string;
      input: UpdateMeetingInput;
    }) => calendarApi.updateMeeting(workspaceId!, meetingId, input),
    onSuccess: () => invalidateMeetingQueries(queryClient, workspaceId),
  });
}

export function useDeleteMeeting() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) => calendarApi.deleteMeeting(workspaceId!, meetingId),
    onSuccess: () => invalidateMeetingQueries(queryClient, workspaceId),
  });
}
