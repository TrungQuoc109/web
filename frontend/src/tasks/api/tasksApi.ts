import { httpClient } from "@/shared/api/http-client";
import type {
  TaskComment,
  TaskItem,
  TaskStatus,
  TaskUser,
} from "@/tasks/types/task";
import type { TaskPriority } from "@/shared/types/workspace";

type BackendTaskAssignment = {
  id: number;
  role: "LEAD" | "CONTRIBUTOR";
  assignedById: number | null;
  assignedAt: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  };
};

type BackendTask = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  assignments: BackendTaskAssignment[];
};

type BackendMessage = {
  id: number;
  content: string;
  senderId: number | null;
  projectId: number;
  taskId: number | null;
  isSystem: boolean;
  isImportant: boolean;
  isAnnouncement: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  sender: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  } | null;
};

type BackendProjectMember = {
  id: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    email: string;
    name: string | null;
    role: string;
  };
};

type UpdateTaskStatusPayload = {
  taskId: string;
  status: TaskStatus;
};

type AssignTaskUsersPayload = {
  taskId: string;
  userIds: string[];
};

export type CreateTaskPayload = {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
};

function mapTaskUser(assignment: BackendTaskAssignment): TaskUser {
  return {
    id: String(assignment.user.id),
    name: assignment.user.name,
    email: assignment.user.email,
  };
}

function mapTask(task: BackendTask): TaskItem {
  return {
    id: String(task.id),
    projectId: String(task.projectId),
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    assignees: task.assignments.map(mapTaskUser),
    comments: [],
  };
}

function mapTaskComment(message: BackendMessage): TaskComment {
  return {
    id: String(message.id),
    author: message.sender
      ? {
          id: String(message.sender.id),
          name: message.sender.name,
          email: message.sender.email,
        }
      : null,
    content: message.content,
    createdAt: message.createdAt,
  };
}

function mapProjectMember(member: BackendProjectMember): TaskUser {
  return {
    id: String(member.user.id),
    name: member.user.name,
    email: member.user.email,
  };
}

export const tasksApi = {
  async getBoard(): Promise<TaskItem[]> {
    const response = await httpClient.get<BackendTask[]>("/tasks");
    return response.data.map(mapTask);
  },

  async create(payload: CreateTaskPayload): Promise<TaskItem> {
    const response = await httpClient.post<BackendTask>(
      `/projects/${payload.projectId}/tasks`,
      {
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
      }
    );

    return mapTask(response.data);
  },

  async updateStatus(payload: UpdateTaskStatusPayload): Promise<TaskItem> {
    const response = await httpClient.patch<BackendTask>(
      `/tasks/${payload.taskId}/status`,
      { status: payload.status }
    );
    return mapTask(response.data);
  },

  async getComments(taskId: string): Promise<TaskComment[]> {
    const response = await httpClient.get<BackendMessage[]>(
      `/tasks/${taskId}/messages`
    );
    return response.data.map(mapTaskComment);
  },

  async getAssignableUsers(projectId: string): Promise<TaskUser[]> {
    const response = await httpClient.get<BackendProjectMember[]>(
      `/projects/${projectId}/members`
    );
    return response.data.map(mapProjectMember);
  },

  async assignUsers(payload: AssignTaskUsersPayload): Promise<void> {
    await httpClient.post(`/tasks/${payload.taskId}/assignments`, {
      assignees: payload.userIds.map((userId) => ({
        userId: Number(userId),
        role: "CONTRIBUTOR",
      })),
    });
  },
};
