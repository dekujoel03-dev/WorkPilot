export type SearchResultType = 'project' | 'task' | 'person' | 'comment';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  meta?: Record<string, string>;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  grouped: {
    projects: SearchResultItem[];
    tasks: SearchResultItem[];
    people: SearchResultItem[];
    comments: SearchResultItem[];
  };
}

export interface DashboardStats {
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  timeWorkedMinutes: number;
  timeWorkedHours: number;
  avgProgress: number;
  workloadPercent: number;
}

export interface CalendarEvent {
  id: string;
  type: 'task' | 'meeting';
  title: string;
  start: string;
  end: string;
  color?: string;
  projectName?: string;
  projectId?: string;
  allDay?: boolean;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}
