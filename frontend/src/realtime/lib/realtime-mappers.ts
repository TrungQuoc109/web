import type { ChatMessage } from "@/messages/types/message";
import type { TaskItem, TaskStatus, TaskUser } from "@/tasks/types/task";
import type { TaskPriority } from "@/shared/types/workspace";

type BackendRealtimeUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

type BackendRealtimeTaskAssignment = {
  id: number;
  role: "LEAD" | "CONTRIBUTOR";
  assignedById: number | null;
  assignedAt: string;
  user: BackendRealtimeUser;
};

export type RealtimeMessagePayload = {
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
  sender: BackendRealtimeUser | null;
};

export type RealtimeTaskPayload = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  assignments: BackendRealtimeTaskAssignment[];
};

function mapTaskUser(user: BackendRealtimeUser): TaskUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
  };
}

export function mapRealtimeMessage(payload: RealtimeMessagePayload): ChatMessage {
  return {
    id: String(payload.id),
    author: payload.sender
      ? {
          name: payload.sender.name,
          email: payload.sender.email,
        }
      : null,
    content: payload.content,
    createdAt: payload.createdAt,
    type: payload.isSystem
      ? "system"
      : payload.isAnnouncement
        ? "announcement"
        : "normal",
    senderId: payload.senderId ? String(payload.senderId) : null,
  };
}

export function mapRealtimeTask(payload: RealtimeTaskPayload): TaskItem {
  return {
    id: String(payload.id),
    projectId: String(payload.projectId),
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: payload.status,
    assignees: payload.assignments.map((assignment) => mapTaskUser(assignment.user)),
    comments: [],
  };
}
