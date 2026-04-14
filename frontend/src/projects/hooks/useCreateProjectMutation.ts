import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectsService } from "@/projects/services/projectsService";
import type { CreateProjectPayload } from "@/projects/api/projectApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { showErrorToast } from "@/shared/lib/toast-store";

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectsService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
    },
    onError: (error) => {
      showErrorToast(getApiErrorMessage(error), "Create project failed");
    },
  });
}
