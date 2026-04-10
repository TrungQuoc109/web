import type { TaskPriority, TaskStatus } from "@/shared/types/workspace";

export type { TaskPriority, TaskStatus } from "@/shared/types/workspace";

export type TaskPriorityFilter = "ALL" | TaskPriority;

export type TaskUser = {
  id: string;
  name: string;
  email: string;
};

export type TaskComment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignees: TaskUser[];
  comments: TaskComment[];
};
