import { useMutation, useQueryClient } from "@tanstack/react-query";

import { membersApi } from "@/members/api/membersApi";
import { useI18n } from "@/i18n/useI18n";
import type { MemberRole } from "@/members/types/member";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { membersKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

type UpdateMemberRoleInput = {
  projectId: string;
  memberId: string;
  role: MemberRole;
};

export function useUpdateMemberRoleMutation() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, memberId, role }: UpdateMemberRoleInput) =>
      membersApi.updateRole(projectId, memberId, role),
    onSuccess: (member, variables) => {
      void queryClient.invalidateQueries({
        queryKey: membersKeys.project(variables.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.activity(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: tasksKeys.projectMembers(variables.projectId),
      });

      useToastStore.getState().push({
        title: t("toast.memberRoleUpdatedTitle"),
        description: t("toast.memberRoleUpdatedDescription", {
          email: member.email,
          role: member.role,
        }),
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Role update failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
