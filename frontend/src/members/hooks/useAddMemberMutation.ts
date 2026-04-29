import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AddMemberPayload, membersApi } from "@/members/api/membersApi";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { membersKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useAddMemberMutation() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddMemberPayload) => membersApi.add(payload),
    onSuccess: (member, variables) => {
      void queryClient.invalidateQueries({ queryKey: membersKeys.project(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(variables.projectId) });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.activity(variables.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.projectMembers(variables.projectId) });

      useToastStore.getState().push({
        title: t("toast.memberAddedTitle"),
        description: t("toast.memberAddedDescription", { email: member.email }),
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Add member failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
