import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/auth/store/authStore";
import { updateRealtimeTaskStatus } from "@/realtime/lib/realtime-actions";
import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskItem, TaskStatus } from "@/tasks/types/task";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { showErrorToast } from "@/shared/lib/toast-store";

type UpdateTaskStatusInput = {
  taskId: string;
  status: TaskStatus;
};

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (payload: UpdateTaskStatusInput) => {
      if (!accessToken) {
        return tasksApi.updateStatus(payload);
      }

      try {
        return await updateRealtimeTaskStatus(accessToken, payload);
      } catch {
        return tasksApi.updateStatus(payload);
      }
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.board() });

      const previousTasks = queryClient.getQueryData<TaskItem[]>(tasksKeys.board());

      queryClient.setQueryData<TaskItem[]>(tasksKeys.board(), (current = []) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
              }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.board(), context.previousTasks);
      }
      showErrorToast(getApiErrorMessage(error), "Update task status failed");
    },
    onSuccess: (task) => {
      queryClient.setQueryData<TaskItem[]>(tasksKeys.board(), (current = []) =>
        current.map((item) => (item.id === task.id ? { ...item, ...task } : item))
      );
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.board() });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.comments(variables.taskId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}
