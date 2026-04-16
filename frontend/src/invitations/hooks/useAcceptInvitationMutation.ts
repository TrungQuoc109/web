import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invitationsApi } from "@/invitations/api/invitationsApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { authKeys, dashboardKeys, projectsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => invitationsApi.acceptInvitation(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: "Invitation accepted",
        description: "You have joined the project successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Accept invitation failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
