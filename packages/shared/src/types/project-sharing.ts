import type { UserSummary } from './collaboration';

export type ProjectRole = 'VIEWER' | 'EDITOR' | 'ADMIN';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  user: UserSummary & { email: string };
}

export interface AddProjectMemberInput {
  email: string;
  role?: ProjectRole;
}

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  VIEWER: 'Lecteur',
  EDITOR: 'Éditeur',
  ADMIN: 'Admin',
};
