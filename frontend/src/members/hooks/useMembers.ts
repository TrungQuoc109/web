import { useQuery } from "@tanstack/react-query";

import { membersApi } from "@/members/api/membersApi";
import type { Member } from "@/members/types/member";
import { membersKeys } from "@/shared/lib/query-keys";

export function useMembers(projectId?: string) {
  return useQuery<Member[]>({
    queryKey: membersKeys.project(projectId),
    queryFn: () => membersApi.list(projectId!),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}
