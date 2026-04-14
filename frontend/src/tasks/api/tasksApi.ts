import { httpClient } from "@/shared/api/http-client";
import type { TaskComment, TaskItem, TaskStatus, TaskUser } from "@/tasks/types/task";
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

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return relativeTimeFormatter.format(diffDays, "day");
  }

  return date.toLocaleDateString();
}

function mapTaskUser(assignment: BackendTaskAssignment): TaskUser {
  return {
    id: String(assignment.user.id),
    name: assignment.user.name ?? assignment.user.email,
    email: assignment.user.email,
  };
}

function mapTask(task: BackendTask): TaskItem {
  return {
    id: String(task.id),
    projectId: String(task.projectId),
    title: task.title,
    description: task.description ?? "No description yet.",
    priority: task.priority,
    status: task.status,
    assignees: task.assignments.map(mapTaskUser),
    comments: [],
  };
}

function mapTaskComment(message: BackendMessage): TaskComment {
  return {
    id: String(message.id),
    author: message.sender?.name ?? message.sender?.email ?? "System",
    content: message.content,
    timestamp: formatRelativeTime(message.createdAt),
  };
}

function mapProjectMember(member: BackendProjectMember): TaskUser {
  return {
    id: String(member.user.id),
    name: member.user.name ?? member.user.email,
    email: member.user.email,
  };
}

export const tasksApi = {
  async getBoard(): Promise<TaskItem[]> {
    const response = await httpClient.get<BackendTask[]>("/tasks");
    return response.data.map(mapTask);
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
