import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectApi, type TransferProjectOwnershipPayload } from "@/projects/api/projectApi";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { projectsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useTransferProjectOwnershipMutation() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransferProjectOwnershipPayload) =>
      projectApi.transferOwnership(payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.activity(variables.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });

      useToastStore.getState().push({
        title: t("toast.ownershipTransferredTitle"),
        description: t("toast.ownershipTransferredDescription"),
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Ownership transfer failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
