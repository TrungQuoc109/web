import { useQuery } from "@tanstack/react-query";

import { membersService } from "@/members/services/membersService";
import type { Member } from "@/members/types/member";

export function useMembers(projectId?: string) {
  return useQuery<Member[]>({
    queryKey: ["members", "project", projectId],
    queryFn: () => membersService.list(projectId!),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
