import type { InvitationStatus, MemberRole } from "@/shared/types/workspace";

export type ProjectInvitation = {
  id: string;
  email: string;
  token?: string;
  tokenPreview?: string | null;
  projectId: string;
  senderId: string;
  status: InvitationStatus;
  role: MemberRole;
  expiresAt: string;
  createdAt: string;
  sentAt?: string;
};
