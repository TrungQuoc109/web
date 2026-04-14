import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskComment, TaskItem, TaskStatus, TaskUser } from "@/tasks/types/task";

type TasksApiService = {
  getBoard: () => Promise<TaskItem[]>;
  updateStatus: (payload: { taskId: string; status: TaskStatus }) => Promise<TaskItem>;
  getComments: (taskId: string) => Promise<TaskComment[]>;
  getAssignableUsers: (projectId: string) => Promise<TaskUser[]>;
  assignUsers: (payload: { taskId: string; userIds: string[] }) => Promise<void>;
};

export const tasksApiService: TasksApiService = {
  getBoard: tasksApi.getBoard,
  updateStatus: tasksApi.updateStatus,
  getComments: tasksApi.getComments,
  getAssignableUsers: tasksApi.getAssignableUsers,
  assignUsers: tasksApi.assignUsers,
};
