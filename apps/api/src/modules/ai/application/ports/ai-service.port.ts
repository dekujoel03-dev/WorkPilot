import type {
  MeetingSummaryOutput,
  ProjectBreakdownOutput,
  TaskRiskOutput,
  AssistantResponse,
  AssistantMessage,
} from '@work-pilot/shared';

export const AI_SERVICE = 'AI_SERVICE';

export interface IAIService {
  summarizeMeeting(input: {
    title: string;
    description?: string | null;
    startTime?: string;
    endTime?: string;
  }): Promise<MeetingSummaryOutput>;

  breakdownProject(input: {
    name: string;
    description?: string | null;
  }): Promise<ProjectBreakdownOutput>;

  assessTaskRisk(input: {
    title: string;
    dueDate?: string | null;
    priority?: string | null;
  }): Promise<TaskRiskOutput>;

  chat(input: {
    message: string;
    history?: AssistantMessage[];
    workspaceName?: string;
  }): Promise<AssistantResponse>;
}
