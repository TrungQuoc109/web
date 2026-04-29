import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/auth/store/authStore";
import { updateRealtimeTaskStatus } from "@/realtime/lib/realtime-actions";
import { dashboardKeys, projectsKeys, tasksKeys } from "@/shared/lib/query-keys";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { showErrorToast } from "@/shared/lib/toast-store";
import { tasksApi } from "@/tasks/api/tasksApi";
import type { TaskItem, TasksCatalog, TaskStatus } from "@/tasks/types/task";

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
      await queryClient.cancelQueries({ queryKey: tasksKeys.all });

      const previousTasks = queryClient.getQueryData<TaskItem[]>(tasksKeys.board());
      const previousCatalogs = queryClient.getQueriesData<TasksCatalog>({
        queryKey: tasksKeys.all,
      });

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

      queryClient.setQueriesData<TasksCatalog>(
        { queryKey: tasksKeys.all },
        (current) => {
          if (!current?.items) {
            return current;
          }

          return {
            ...current,
            items: current.items.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status,
                  }
                : task
            ),
          };
        }
      );

      return { previousTasks, previousCatalogs };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.board(), context.previousTasks);
      }

      context?.previousCatalogs.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });

      showErrorToast(getApiErrorMessage(error), "Update task status failed");
    },
    onSuccess: (task) => {
      queryClient.setQueryData<TaskItem[]>(tasksKeys.board(), (current = []) =>
        current.map((item) => (item.id === task.id ? { ...item, ...task } : item))
      );

      queryClient.setQueriesData<TasksCatalog>(
        { queryKey: tasksKeys.all },
        (current) => {
          if (!current?.items) {
            return current;
          }

          return {
            ...current,
            items: current.items.map((item) =>
              item.id === task.id ? { ...item, ...task } : item
            ),
          };
        }
      );
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: tasksKeys.all });
      void queryClient.invalidateQueries({
        queryKey: tasksKeys.comments(variables.taskId),
      });
      const task = queryClient
        .getQueryData<TaskItem[]>(tasksKeys.board())
        ?.find((item) => item.id === variables.taskId);
      if (task?.projectId) {
        void queryClient.invalidateQueries({
          queryKey: projectsKeys.activity(task.projectId),
        });
      }
      void queryClient.invalidateQueries({ queryKey: projectsKeys.details() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
    },
  });
}
