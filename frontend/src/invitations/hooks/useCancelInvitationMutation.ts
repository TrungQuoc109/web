import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invitationsApi } from "@/invitations/api/invitationsApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { invitationsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useCancelInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { projectId: string; invitationId: string }) =>
      invitationsApi.cancelInvitation(payload.projectId, payload.invitationId),
    onSuccess: (invitation) => {
      void queryClient.invalidateQueries({
        queryKey: invitationsKeys.project(invitation.projectId),
      });

      useToastStore.getState().push({
        title: "Invitation canceled",
        description: `${invitation.email} can no longer use the previous invite link.`,
        variant: "info",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Cancel invitation failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
