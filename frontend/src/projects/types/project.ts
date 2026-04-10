import type {
  MemberRole,
  ProjectStatus,
  TaskStatus,
} from "@/shared/types/workspace";

export type ProjectStatusFilter = "ALL" | ProjectStatus;

export type Project = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  progress: number;
  status: ProjectStatus;
  updatedAt: string;
};

export type ProjectMember = {
  id: string;
  name: string;
  role: MemberRole | string;
  email: string;
};

export type ProjectMessage = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

export type ProjectActivity = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  assignee: string;
  status: TaskStatus;
};

export type ProjectDetail = Project & {
  tasksByStatus: Record<TaskStatus, number>;
  totalTasks: number;
  recentActivity: ProjectActivity[];
  tasks: ProjectTask[];
  members: ProjectMember[];
  messages: ProjectMessage[];
};
