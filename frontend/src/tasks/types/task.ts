import type {
  ReportStatus,
  TaskAssignmentRole,
  TaskPriority,
  TaskStatus,
} from "@/shared/types/workspace";

export type {
  ReportStatus,
  TaskAssignmentRole,
  TaskPriority,
  TaskStatus,
} from "@/shared/types/workspace";

export type TaskPriorityFilter = "ALL" | TaskPriority;
export type TaskStatusFilter = "ALL" | TaskStatus;

export type TaskUser = {
  id: string;
  assignmentId?: string;
  name: string | null;
  email: string;
  assignmentRole?: TaskAssignmentRole;
};

export type TaskComment = {
  id: string;
  author: TaskUser | null;
  content: string;
  createdAt: string;
};

export type TaskItem = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignees: TaskUser[];
  comments: TaskComment[];
};

export type TaskReport = {
  id: string;
  content: string;
  attachments: string[];
  status: ReportStatus;
  feedback: string | null;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: TaskUser;
};

export type TasksCatalog = {
  items: TaskItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
