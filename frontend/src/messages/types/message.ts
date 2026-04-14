export type ChatMessageType = "normal" | "system" | "announcement";

export type ChatMessage = {
  id: string;
  author: {
    name: string;
    email: string;
  } | null;
  content: string;
  createdAt: string;
  type: ChatMessageType;
  senderId?: string | null;
  isCurrentUser?: boolean;
};
