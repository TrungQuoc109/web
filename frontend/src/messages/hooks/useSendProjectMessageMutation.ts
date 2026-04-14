import { useMutation, useQueryClient } from "@tanstack/react-query";

import { messagesService } from "@/messages/services/messagesService";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { showErrorToast } from "@/shared/lib/toast-store";

type SendProjectMessageInput = {
  projectId: string;
  content: string;
};

export function useSendProjectMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendProjectMessageInput) =>
      messagesService.sendProjectMessage(payload),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Send message failed");
    },
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["messages", "project", variables.projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["projects", "detail", variables.projectId],
      });
    },
  });
}
