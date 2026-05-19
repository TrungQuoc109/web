import type {
  MemberRole,
  ProjectStatus,
  TaskStatus,
} from "@/shared/types/workspace";

export type ProjectStatusFilter = "ALL" | ProjectStatus;

export type ProjectsCatalog = {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  progress: number;
  status: ProjectStatus;
  updatedAt: string;
};

export type ProjectMember = {
  id: string;
  userId?: string;
  name: string | null;
  role: MemberRole | string;
  email: string;
};

export type ProjectMessage = {
  id: string;
  author: {
    name: string | null;
    email: string;
  } | null;
  content: string;
  createdAt: string;
};

export type ProjectActivity = {
  id: string;
  title: string;
  description: string;
  category: "PROJECT" | "MEMBER" | "MESSAGE" | "TASK" | "REPORT" | "INVITATION";
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  assignee: {
    name: string | null;
    email: string;
  } | null;
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
