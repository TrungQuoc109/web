import { ProjectRole, Role, TaskPriority, TaskStatus } from '@prisma/client';

export interface ProjectMemberView {
  id: number;
  role: ProjectRole;
  joinedAt: Date;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
  };
}

export interface ProjectView {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectListItemView extends ProjectView {
  memberCount: number;
  totalTasks: number;
  completedTaskCount: number;
  blockedTaskCount: number;
}

export interface ProjectTaskListItemView {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: {
    id: number;
    email: string;
    name: string | null;
  } | null;
}

export interface ProjectMessageListItemView {
  id: number;
  content: string;
  createdAt: Date;
  isSystem: boolean;
  isAnnouncement: boolean;
  sender: {
    id: number;
    email: string;
    name: string | null;
  } | null;
}

export interface ProjectActivityView {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
}

export interface ProjectDetailView extends ProjectView {
  memberCount: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasks: ProjectTaskListItemView[];
  members: ProjectMemberView[];
  messages: ProjectMessageListItemView[];
  recentActivity: ProjectActivityView[];
}
