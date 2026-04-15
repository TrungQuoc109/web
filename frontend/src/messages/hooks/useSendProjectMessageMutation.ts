import { useMutation, useQueryClient } from "@tanstack/react-query";

import { messagesApi } from "@/messages/api/messagesApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, messagesKeys, projectsKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

type SendProjectMessageInput = {
  projectId: string;
  content: string;
};

export function useSendProjectMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendProjectMessageInput) =>
      messagesApi.sendProjectMessage(payload),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Send message failed");
    },
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({ queryKey: messagesKeys.project(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}
