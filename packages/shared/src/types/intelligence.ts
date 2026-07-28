export interface DailyBriefTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  estimatedTime: number | null;
  projectName?: string;
}

export interface DailyBriefMeeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
}

export interface DailyBriefResponse {
  greeting: string;
  date: string;
  criticalTasks: DailyBriefTask[];
  meetings: DailyBriefMeeting[];
  overdue: DailyBriefTask[];
  estimatedHours: number;
  estimatedMinutes: number;
  mainGoal: DailyBriefTask | null;
  workloadPercent: number;
  maxDailyHours: number;
}

export type ReminderSuggestion = 'START_NOW' | 'AUTO_RESCHEDULE' | 'NONE';

export interface SmartReminder {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId?: string;
  scheduledAt: string;
  status: string;
  suggestion: ReminderSuggestion | null;
  message: string;
  todayWorkloadHours: number;
  maxDailyHours: number;
}

export type ReminderAction = 'START_NOW' | 'AUTO_RESCHEDULE' | 'DISMISS' | 'SNOOZE';
