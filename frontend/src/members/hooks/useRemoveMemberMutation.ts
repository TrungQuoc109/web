import { useMutation, useQueryClient } from "@tanstack/react-query";

import { membersService } from "@/members/services/membersService";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { showErrorToast } from "@/shared/lib/toast-store";

type RemoveMemberInput = {
  projectId: string;
  memberId: string;
};

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, memberId }: RemoveMemberInput) =>
      membersService.remove(projectId, memberId),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Remove member failed");
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["members", "project", variables.projectId],
      });
      void queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      void queryClient.invalidateQueries({
        queryKey: ["projects", "detail", variables.projectId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", "project-members", variables.projectId],
      });
    },
  });
}
