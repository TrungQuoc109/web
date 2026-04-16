import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/auth/store/authStore";
import { useProjects } from "@/projects/hooks/useProjects";
import {
  dashboardKeys,
  messagesKeys,
  notificationsKeys,
  projectsKeys,
  tasksKeys,
} from "@/shared/lib/query-keys";
import {
  disconnectRealtimeSocket,
  getRealtimeSocket,
} from "@/realtime/lib/realtime-socket";
import {
  mapRealtimeMessage,
  mapRealtimeTaskComment,
  mapRealtimeTask,
  type RealtimeMessagePayload,
  type RealtimeTaskPayload,
} from "@/realtime/lib/realtime-mappers";
import type { ChatMessage } from "@/messages/types/message";
import type { TaskComment, TaskItem } from "@/tasks/types/task";

type SocketAck<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
};

export function RealtimeBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const projectsQuery = useProjects();
  const queryClient = useQueryClient();
  const joinedProjectsRef = useRef<Set<string>>(new Set());
  const disconnectHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!accessToken) {
      joinedProjectsRef.current.clear();
      disconnectRealtimeSocket();
      return;
    }

    const socket = getRealtimeSocket(accessToken);

    function handleMessageCreated(payload: RealtimeMessagePayload) {
      const projectId = String(payload.projectId);
      const taskId = payload.taskId ? String(payload.taskId) : null;

      if (taskId) {
        const comment = mapRealtimeTaskComment(payload);

        queryClient.setQueryData<TaskComment[]>(
          tasksKeys.comments(taskId),
          (current = []) => {
            if (current.some((item) => item.id === comment.id)) {
              return current;
            }

            return [...current, comment];
          }
        );
      } else {
        const message = mapRealtimeMessage(payload);

        queryClient.setQueryData<ChatMessage[]>(
          messagesKeys.project(projectId),
          (current = []) => {
            if (current.some((item) => item.id === message.id)) {
              return current;
            }

            return [...current, message];
          }
        );
      }

      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
    }

    function handleTaskUpdated(payload: RealtimeTaskPayload) {
      const task = mapRealtimeTask(payload);

      queryClient.setQueryData<TaskItem[]>(tasksKeys.board(), (current = []) => {
        const existingIndex = current.findIndex((item) => item.id === task.id);

        if (existingIndex === -1) {
          return [...current, task];
        }

        return current.map((item) => (item.id === task.id ? { ...item, ...task } : item));
      });

      void queryClient.invalidateQueries({ queryKey: projectsKeys.detail(task.projectId) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.overview() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.comments(task.id) });
    }

    socket.on("message:created", handleMessageCreated);
    socket.on("task:updated", handleTaskUpdated);
    const handleDisconnect = () => {
      joinedProjectsRef.current.clear();
    };
    disconnectHandlerRef.current = handleDisconnect;
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("message:created", handleMessageCreated);
      socket.off("task:updated", handleTaskUpdated);
      if (disconnectHandlerRef.current) {
        socket.off("disconnect", disconnectHandlerRef.current);
      }
    };
  }, [accessToken, queryClient]);

  useEffect(() => {
    if (!accessToken || !projectsQuery.data?.length) {
      return;
    }

    const socket = getRealtimeSocket(accessToken);

    const joinProject = (projectId: string) => {
      if (joinedProjectsRef.current.has(projectId)) {
        return;
      }

      socket.emit(
        "project:join",
        { projectId: Number(projectId) },
        (ack?: SocketAck<{ room: string }>) => {
          if (ack?.success) {
            joinedProjectsRef.current.add(projectId);
          }
        }
      );
    };

    if (socket.connected) {
      projectsQuery.data.forEach((project) => joinProject(project.id));
      return;
    }

    const handleConnect = () => {
      joinedProjectsRef.current.clear();
      projectsQuery.data?.forEach((project) => joinProject(project.id));
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [accessToken, projectsQuery.data]);

  return null;
}
