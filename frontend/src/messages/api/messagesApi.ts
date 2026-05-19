import { httpClient } from "@/shared/api/http-client";
import type {
  ChatMessage,
  ChatMessageType,
  ChatMessagesCatalog,
} from "@/messages/types/message";

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
  isAnnouncement?: boolean;
};

type SendTaskMessagePayload = {
  taskId: string;
  content: string;
};

type ListProjectMessagesCatalogFilters = {
  projectId: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type BackendMessagesCatalogResponse = {
  items: BackendMessage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

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
          name: message.sender.name,
          email: message.sender.email,
        }
      : null,
    content: message.content,
    createdAt: message.createdAt,
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
        isAnnouncement: payload.isAnnouncement,
      }
    );
    return mapMessage(response.data);
  },

  async sendTaskMessage(payload: SendTaskMessagePayload): Promise<ChatMessage> {
    const response = await httpClient.post<BackendMessage>(
      `/tasks/${payload.taskId}/messages`,
      {
        content: payload.content,
      }
    );
    return mapMessage(response.data);
  },

  async listProjectMessagesCatalog(
    filters: ListProjectMessagesCatalogFilters
  ): Promise<ChatMessagesCatalog> {
    const response = await httpClient.get<BackendMessagesCatalogResponse>(
      `/projects/${filters.projectId}/messages/catalog`,
      {
        params: {
          search: filters.search,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      }
    );

    return {
      items: response.data.items.map(mapMessage),
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    };
  },
};
