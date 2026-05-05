import { useMembers } from "@/members/hooks/useMembers";
import type { ListMembersFilters } from "@/members/api/membersApi";

export function useProjectMembers(projectId?: string, filters?: ListMembersFilters) {
  return useMembers(projectId, filters);
}

