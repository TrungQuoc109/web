import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tasksApi } from "@/tasks/api/tasksApi";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { useToastStore } from "@/shared/lib/toast-store";

export function useReviewTaskReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      reportId: string;
      taskId: string;
      status: "APPROVED" | "REJECTED";
      feedback?: string;
      rejectionReason?: string;
    }) => tasksApi.reviewReport(payload),
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.reports(report.taskId) });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.comments(report.taskId) });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
      const task = queryClient
        .getQueriesData<{ items?: Array<{ id: string; projectId: string }> }>({
          queryKey: tasksKeys.all,
        })
        .flatMap(([, data]) => data?.items ?? [])
        .find((item) => item.id === report.taskId);
      if (task?.projectId) {
        void queryClient.invalidateQueries({
          queryKey: projectsKeys.activity(task.projectId),
        });
      }
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });

      useToastStore.getState().push({
        title:
          report.status === "APPROVED" ? "Report approved" : "Report rejected",
        description:
          report.status === "APPROVED"
            ? "The task report was approved successfully."
            : "The task report was sent back with feedback.",
        variant: report.status === "APPROVED" ? "success" : "info",
      });
    },
    onError: (error) => {
      useToastStore.getState().push({
        title: "Review report failed",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}
