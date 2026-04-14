import { emptyMembersMock, membersMock } from "@/members/mock/membersMock";
import type { Member } from "@/members/types/member";
import { mockDelay } from "@/shared/api/mockDelay";

export const membersFallbackService = {
  async list(): Promise<Member[]> {
    await mockDelay(350);

    return import.meta.env.VITE_MEMBERS_EMPTY === "1"
      ? emptyMembersMock
      : membersMock;
  },
};
