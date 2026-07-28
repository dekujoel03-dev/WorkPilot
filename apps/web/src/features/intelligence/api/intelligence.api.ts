import { api } from '@/lib/api';
import type { DailyBriefResponse, SmartReminder, ReminderAction } from '@work-pilot/shared';

export const intelligenceApi = {
  dailyBrief: (workspaceId: string) =>
    api<{ data: DailyBriefResponse }>(`/workspaces/${workspaceId}/daily-brief`),

  reminders: (workspaceId: string) =>
    api<{ data: SmartReminder[] }>(`/workspaces/${workspaceId}/reminders`),

  syncReminders: (workspaceId: string) =>
    api<{ data: SmartReminder[] }>(`/workspaces/${workspaceId}/reminders/sync`, {
      method: 'POST',
    }),

  reminderAction: (workspaceId: string, reminderId: string, action: ReminderAction) =>
    api<{ data: { action: ReminderAction; taskId?: string; projectId?: string } }>(
      `/workspaces/${workspaceId}/reminders/${reminderId}/action`,
      { method: 'POST', body: { action } },
    ),
};
