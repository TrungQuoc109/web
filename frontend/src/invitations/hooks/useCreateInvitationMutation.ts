import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invitationsApi } from "@/invitations/api/invitationsApi";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { invitationsKeys, membersKeys, projectsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useCreateInvitationMutation() {
  const { t } = useI18n();
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
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.activity(invitation.projectId),
      });

      useToastStore.getState().push({
        title: t("toast.invitationCreatedTitle"),
        description: t("toast.invitationCreatedDescription", {
          email: invitation.email,
          role: invitation.role,
        }),
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: t("toast.createInvitationFailedTitle"),
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
