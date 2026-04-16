import { emitRealtimeEvent } from "@/realtime/lib/realtime-socket";
import {
  mapRealtimeMessage,
  mapRealtimeTask,
  type RealtimeMessagePayload,
  type RealtimeTaskPayload,
} from "@/realtime/lib/realtime-mappers";
import type { ChatMessage } from "@/messages/types/message";
import type { TaskItem, TaskStatus } from "@/tasks/types/task";

export function joinRealtimeTaskRoom(token: string, taskId: string) {
  return emitRealtimeEvent<{ taskId: number }, { room: string }>(
    token,
    "task:join",
    { taskId: Number(taskId) }
  );
}

export async function sendRealtimeProjectMessage(
  token: string,
  payload: {
    projectId: string;
    content: string;
    isAnnouncement?: boolean;
  }
): Promise<ChatMessage> {
  const message = await emitRealtimeEvent<
    {
      projectId: number;
      content: string;
      isAnnouncement?: boolean;
    },
    RealtimeMessagePayload
  >(token, "message:create", {
    projectId: Number(payload.projectId),
    content: payload.content,
    isAnnouncement: payload.isAnnouncement,
  });

  return mapRealtimeMessage(message);
}

export async function sendRealtimeTaskMessage(
  token: string,
  payload: {
    taskId: string;
    content: string;
  }
): Promise<ChatMessage> {
  const message = await emitRealtimeEvent<
    {
      taskId: number;
      content: string;
    },
    RealtimeMessagePayload
  >(token, "message:create", {
    taskId: Number(payload.taskId),
    content: payload.content,
  });

  return mapRealtimeMessage(message);
}

export async function updateRealtimeTaskStatus(
  token: string,
  payload: {
    taskId: string;
    status: TaskStatus;
  }
): Promise<TaskItem> {
  const task = await emitRealtimeEvent<
    {
      taskId: number;
      status: TaskStatus;
    },
    RealtimeTaskPayload
  >(token, "task:update", {
    taskId: Number(payload.taskId),
    status: payload.status,
  });

  return mapRealtimeTask(task);
}
