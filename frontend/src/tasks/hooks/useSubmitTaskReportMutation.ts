import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useSubmitTaskReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      taskId: string;
      content: string;
      attachments?: string[];
    }) => tasksApi.submitReport(payload),
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.reports(report.taskId) });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.comments(report.taskId) });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.board() });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title: "Report submitted",
        description: "Your task report is now waiting for lead review.",
        variant: "success",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Submit report failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
