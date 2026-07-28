import type { ProjectHealth, TaskPriority } from './index';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  budget: number | null;
  progress: number;
  health: ProjectHealth;
  startDate: string | null;
  endDate: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number; lists: number };
}

export interface ProjectList {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
}

export interface TaskStatus {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  position: number;
  isDone: boolean;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  listId: string | null;
  statusId: string | null;
  parentId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  color: string | null;
  position: number;
  startDate: string | null;
  dueDate: string | null;
  estimatedTime: number | null;
  actualTime: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status?: TaskStatus | null;
  _count?: { subtasks: number; comments: number };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  teamId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  health?: ProjectHealth;
  progress?: number;
  archived?: boolean;
}

export interface CreateProjectListInput {
  name: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  listId?: string;
  statusId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedTime?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  listId?: string | null;
  statusId?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  estimatedTime?: number | null;
  position?: number;
}

export interface MoveTaskInput {
  listId: string;
  position: number;
}

export interface ReorderInput {
  items: Array<{ id: string; position: number }>;
}
