import type { InvitationStatus, MemberRole } from "@/shared/types/workspace";

export type ProjectInvitation = {
  id: string;
  email: string;
  token: string;
  projectId: string;
  senderId: string;
  status: InvitationStatus;
  role: MemberRole;
  expiresAt: string;
  createdAt: string;
};
