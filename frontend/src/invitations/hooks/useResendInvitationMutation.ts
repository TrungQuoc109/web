import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invitationsApi } from "@/invitations/api/invitationsApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { invitationsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useResendInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { projectId: string; invitationId: string }) =>
      invitationsApi.resendInvitation(payload.projectId, payload.invitationId),
    onSuccess: (invitation) => {
      void queryClient.invalidateQueries({
        queryKey: invitationsKeys.project(invitation.projectId),
      });

      useToastStore.getState().push({
        title: "Invitation resent",
        description: `A fresh invite link is now ready for ${invitation.email}.`,
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Resend invitation failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
