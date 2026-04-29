import { useMutation, useQueryClient } from "@tanstack/react-query";

import { membersApi } from "@/members/api/membersApi";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { membersKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

type RemoveMemberInput = {
  projectId: string;
  memberId: string;
};

export function useRemoveMemberMutation() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, memberId }: RemoveMemberInput) =>
      membersApi.remove(projectId, memberId),
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), t("toast.removeMemberFailedTitle"));
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: membersKeys.project(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(variables.projectId) });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.activity(variables.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.projectMembers(variables.projectId) });
    },
  });
}
