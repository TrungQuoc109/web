import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectApi } from "@/projects/api/projectApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectApi.remove(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: "Project deleted",
        description: "The project and its related workspace data were removed.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Delete project failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
