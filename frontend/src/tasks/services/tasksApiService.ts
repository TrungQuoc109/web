import { tasksApi } from "@/tasks/api/tasksApi";
import type {
  TaskAssignmentRole,
  TaskComment,
  TaskItem,
  TaskReport,
  TaskStatus,
  TaskUser,
} from "@/tasks/types/task";

type TasksApiService = {
  getBoard: () => Promise<TaskItem[]>;
  updateStatus: (payload: { taskId: string; status: TaskStatus }) => Promise<TaskItem>;
  getComments: (taskId: string) => Promise<TaskComment[]>;
  getAssignableUsers: (projectId: string) => Promise<TaskUser[]>;
  assignUsers: (payload: {
    taskId: string;
    assignees: Array<{ userId: string; role: TaskAssignmentRole }>;
  }) => Promise<void>;
  getReports: (taskId: string) => Promise<TaskReport[]>;
  submitReport: (payload: {
    taskId: string;
    content: string;
    attachments?: string[];
  }) => Promise<TaskReport>;
  reviewReport: (payload: {
    reportId: string;
    status: TaskReport["status"];
    feedback?: string;
    rejectionReason?: string;
  }) => Promise<TaskReport>;
};

export const tasksApiService: TasksApiService = {
  getBoard: tasksApi.getBoard,
  updateStatus: tasksApi.updateStatus,
  getComments: tasksApi.getComments,
  getAssignableUsers: tasksApi.getAssignableUsers,
  assignUsers: tasksApi.assignUsers,
  getReports: tasksApi.getReports,
  submitReport: tasksApi.submitReport,
  reviewReport: tasksApi.reviewReport,
};
