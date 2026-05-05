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
  catalog: (filters?: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) =>
    filters
      ? [...projectsKeys.list(), "catalog", filters] as const
      : [...projectsKeys.list(), "catalog"] as const,
  details: () => [...projectsKeys.all, "detail"] as const,
  detail: (projectId?: string) =>
    [...projectsKeys.all, "detail", projectId] as const,
  activity: (projectId?: string) =>
    [...projectsKeys.all, "activity", projectId] as const,
};

export const membersKeys = {
  all: ["members"] as const,
  project: (
    projectId?: string,
    filters?: { search?: string; role?: string }
  ) => [...membersKeys.all, "project", projectId, filters] as const,
};

export const invitationsKeys = {
  all: ["invitations"] as const,
  project: (projectId?: string) =>
    [...invitationsKeys.all, "project", projectId] as const,
};

export const messagesKeys = {
  all: ["messages"] as const,
  project: (projectId?: string) =>
    [...messagesKeys.all, "project", projectId] as const,
  catalog: (
    projectId?: string,
    filters?: { search?: string; page?: number; pageSize?: number }
  ) =>
    filters
      ? [...messagesKeys.all, "catalog", projectId, filters] as const
      : [...messagesKeys.all, "catalog", projectId] as const,
};

export const tasksKeys = {
  all: ["tasks"] as const,
  board: () => [...tasksKeys.all, "board"] as const,
  project: (
    projectId?: string,
    filters?: {
      search?: string;
      status?: string;
      priority?: string;
      assigneeId?: string;
      page?: number;
      pageSize?: number;
    }
  ) =>
    filters
      ? [...tasksKeys.all, "project", projectId, filters] as const
      : [...tasksKeys.all, "project", projectId] as const,
  catalog: (filters?: {
    search?: string;
    projectId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    page?: number;
    pageSize?: number;
  }) =>
    filters
      ? [...tasksKeys.all, "catalog", filters] as const
      : [...tasksKeys.all, "catalog"] as const,
  comments: (taskId?: string) =>
    [...tasksKeys.all, "detail", taskId, "comments"] as const,
  reports: (taskId?: string) =>
    [...tasksKeys.all, "detail", taskId, "reports"] as const,
  projectMembers: (projectId?: string) =>
    [...tasksKeys.all, "project-members", projectId] as const,
};

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
  catalog: (filters?: {
    page?: number;
    pageSize?: number;
    readState?: string;
    type?: string;
  }) =>
    filters
      ? [...notificationsKeys.all, "catalog", filters] as const
      : [...notificationsKeys.all, "catalog"] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
};

export function isAuthQueryKey(queryKey: QueryKey) {
  return queryKey[0] === authKeys.all[0];
}
