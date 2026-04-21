import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invitationsApi } from "@/invitations/api/invitationsApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { invitationsKeys, membersKeys, projectsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useCreateInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      projectId: string;
      email: string;
      role: "ADMIN" | "MEMBER" | "VIEWER";
    }) =>
      invitationsApi.createInvitation(
        payload.projectId,
        payload.email,
        payload.role
      ),
    onSuccess: (invitation) => {
      void queryClient.invalidateQueries({
        queryKey: invitationsKeys.project(invitation.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: membersKeys.project(invitation.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(invitation.projectId) });

      useToastStore.getState().push({
        title: "Invitation created",
        description: `${invitation.email} can now join the project as ${invitation.role}.`,
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Create invitation failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
