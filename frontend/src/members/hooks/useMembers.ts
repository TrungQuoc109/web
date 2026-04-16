import { useQuery } from "@tanstack/react-query";

import { membersApi, type ListMembersFilters } from "@/members/api/membersApi";
import type { Member } from "@/members/types/member";
import { membersKeys } from "@/shared/lib/query-keys";

export function useMembers(projectId?: string, filters?: ListMembersFilters) {
  return useQuery<Member[]>({
    queryKey: membersKeys.project(projectId, filters),
    queryFn: () => membersApi.list(projectId!, filters),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
