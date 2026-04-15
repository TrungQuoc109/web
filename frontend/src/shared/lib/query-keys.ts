import type { QueryKey } from "@tanstack/react-query";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
};

export const projectsKeys = {
  all: ["projects"] as const,
  list: () => [...projectsKeys.all, "list"] as const,
  details: () => [...projectsKeys.all, "detail"] as const,
  detail: (projectId?: string) =>
    [...projectsKeys.all, "detail", projectId] as const,
};

export const membersKeys = {
  all: ["members"] as const,
  project: (projectId?: string) =>
    [...membersKeys.all, "project", projectId] as const,
};

export const messagesKeys = {
  all: ["messages"] as const,
  project: (projectId?: string) =>
    [...messagesKeys.all, "project", projectId] as const,
};

export const tasksKeys = {
  all: ["tasks"] as const,
  board: () => [...tasksKeys.all, "board"] as const,
  comments: (taskId?: string) =>
    [...tasksKeys.all, "detail", taskId, "comments"] as const,
  projectMembers: (projectId?: string) =>
    [...tasksKeys.all, "project-members", projectId] as const,
};

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
};

export function isAuthQueryKey(queryKey: QueryKey) {
  return queryKey[0] === authKeys.all[0];
}
