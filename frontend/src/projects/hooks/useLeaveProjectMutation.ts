import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectApi } from "@/projects/api/projectApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useLeaveProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectApi.leave(projectId),
    onSuccess: (_data, projectId) => {
      queryClient.removeQueries({ queryKey: projectsKeys.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: "Left project",
        description: "You are no longer an active member of this project.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Leave project failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
