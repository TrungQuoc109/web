export type ChatMessageType = "normal" | "system" | "announcement";

export type ChatMessage = {
  id: string;
  author: {
    name: string | null;
    email: string;
  } | null;
  content: string;
  createdAt: string;
  type: ChatMessageType;
  senderId?: string | null;
  isCurrentUser?: boolean;
};

export type ChatMessagesCatalog = {
  items: ChatMessage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
