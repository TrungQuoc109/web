import { httpClient } from "@/shared/api/http-client";
import type { ChatMessage, ChatMessageType } from "@/messages/types/message";

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

type SendProjectMessagePayload = {
  projectId: string;
  content: string;
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

function getMessageType(message: BackendMessage): ChatMessageType {
  if (message.isSystem) {
    return "system";
  }

  if (message.isAnnouncement) {
    return "announcement";
  }

  return "normal";
}

function mapMessage(message: BackendMessage): ChatMessage {
  return {
    id: String(message.id),
    author: message.sender
      ? {
          name: message.sender.name ?? message.sender.email,
          email: message.sender.email,
        }
      : null,
    content: message.content,
    createdAt: formatRelativeTime(message.createdAt),
    type: getMessageType(message),
    senderId: message.senderId ? String(message.senderId) : null,
  };
}

export const messagesApi = {
  async listProjectMessages(projectId: string): Promise<ChatMessage[]> {
    const response = await httpClient.get<BackendMessage[]>(
      `/projects/${projectId}/messages`
    );
    return response.data.map(mapMessage);
  },

  async sendProjectMessage(payload: SendProjectMessagePayload): Promise<ChatMessage> {
    const response = await httpClient.post<BackendMessage>(
      `/projects/${payload.projectId}/messages`,
      {
        content: payload.content,
      }
    );
    return mapMessage(response.data);
  },
};
