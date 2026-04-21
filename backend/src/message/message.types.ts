import { Prisma, Role } from '@prisma/client';

export interface MessageView {
  id: number;
  content: string;
  senderId: number | null;
  projectId: number;
  taskId: number | null;
  isSystem: boolean;
  isImportant: boolean;
  isAnnouncement: boolean;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  sender: {
    id: number;
    email: string;
    name: string | null;
    role: Role;
  } | null;
}

export interface MessageCatalogView {
  items: MessageView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSystemMessageInput {
  projectId: number;
  content: string;
  taskId?: number;
  metadata?: Prisma.InputJsonValue;
  isImportant?: boolean;
  isAnnouncement?: boolean;
}
