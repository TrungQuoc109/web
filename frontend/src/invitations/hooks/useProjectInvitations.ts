import { useQuery } from "@tanstack/react-query";

import { invitationsApi } from "@/invitations/api/invitationsApi";
import type { ProjectInvitation } from "@/invitations/types/invitation";
import { invitationsKeys } from "@/shared/lib/query-keys";

export function useProjectInvitations(projectId?: string) {
  return useQuery<ProjectInvitation[]>({
    queryKey: invitationsKeys.project(projectId),
    queryFn: () => invitationsApi.listProjectInvitations(projectId!),
    enabled: Boolean(projectId),
    staleTime: 15_000,
  });
}
