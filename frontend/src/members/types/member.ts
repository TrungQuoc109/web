import type { MemberRole } from "@/shared/types/workspace";

export type { MemberRole } from "@/shared/types/workspace";

export type Member = {
  id: string;
  userId?: string;
  name: string | null;
  email: string;
  role: MemberRole;
  joinedAt: string;
};
