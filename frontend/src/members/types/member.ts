import type { MemberRole } from "@/shared/types/workspace";

export type { MemberRole } from "@/shared/types/workspace";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
};
