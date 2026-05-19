import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectApi, type UpdateProjectPayload } from "@/projects/api/projectApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) => projectApi.update(payload),
    onSuccess: (_project, variables) => {
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(variables.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: "Project updated",
        description: "The project details were saved successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Update project failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
