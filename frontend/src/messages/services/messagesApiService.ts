import { messagesApi } from "@/messages/api/messagesApi";
import type { ChatMessage } from "@/messages/types/message";

type MessagesApiService = {
  listProjectMessages: (projectId: string) => Promise<ChatMessage[]>;
  sendProjectMessage: (payload: {
    projectId: string;
    content: string;
  }) => Promise<ChatMessage>;
};

export const messagesApiService: MessagesApiService = {
  listProjectMessages: messagesApi.listProjectMessages,
  sendProjectMessage: messagesApi.sendProjectMessage,
};
