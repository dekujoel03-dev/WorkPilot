export type AIJobType =
  | 'MEETING_SUMMARY'
  | 'PROJECT_BREAKDOWN'
  | 'ASSISTANT'
  | 'TASK_RISK';

export type AIJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface AIJob {
  id: string;
  workspaceId: string;
  type: AIJobType;
  status: AIJobStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface SuggestedTask {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface MeetingSummaryOutput {
  summary: string;
  keyPoints: string[];
  suggestedTasks: SuggestedTask[];
}

export interface ProjectBreakdownOutput {
  summary: string;
  suggestedTasks: SuggestedTask[];
}

export interface TaskRiskOutput {
  riskScore: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  suggestion: string;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type AssistantDocumentType =
  | 'USER_STORIES'
  | 'ACCEPTANCE_CRITERIA'
  | 'RISK_ANALYSIS'
  | 'STATUS_REPORT'
  | 'PROJECT_CHARTER';

export interface UserStory {
  id: string;
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RiskItem {
  id: string;
  description: string;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation: string;
}

export interface AssistantResponse {
  /** Texte formaté — sections numérotées, paragraphes, sans puces ni code */
  reply: string;
  suggestions?: string[];
  documentType?: AssistantDocumentType;
  projectName?: string;
  executiveSummary?: string;
  userStories?: UserStory[];
  risks?: RiskItem[];
  suggestedTasks?: SuggestedTask[];
}

export interface AssistantChatInput {
  message: string;
  history?: AssistantMessage[];
}

export type DomainEventType =
  | 'project.created'
  | 'task.updated'
  | 'meeting.ended'
  | 'user.message';

export interface DomainEventPayload {
  workspaceId: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}
