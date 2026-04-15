import type { TaskPriority, TaskStatus } from "@/shared/types/workspace";

export type { TaskPriority, TaskStatus } from "@/shared/types/workspace";

export type TaskPriorityFilter = "ALL" | TaskPriority;

export type TaskUser = {
  id: string;
  name: string | null;
  email: string;
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
