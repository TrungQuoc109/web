import { useQuery } from "@tanstack/react-query";

import { emptyMembersMock, membersMock } from "@/members/mock/membersMock";
import type { Member } from "@/members/types/member";
import { mockDelay } from "@/shared/api/mockDelay";

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ["members", "list"],
    queryFn: async () => {
      await mockDelay(350);

      return import.meta.env.VITE_MEMBERS_EMPTY === "1"
        ? emptyMembersMock
        : membersMock;
    },
    staleTime: Infinity,
  });
}
