import type { InvitationStatus } from "@/shared/types/workspace";

export type ProjectInvitation = {
  id: string;
  email: string;
  token: string;
  projectId: string;
  senderId: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
};
