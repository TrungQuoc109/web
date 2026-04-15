import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectApi, type CreateProjectPayload } from "@/projects/api/projectApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Create project failed");
    },
  });
}
