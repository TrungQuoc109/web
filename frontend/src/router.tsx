import type { ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedLayout } from "@/app/layouts/ProtectedLayout";
import { PublicLayout } from "@/app/layouts/PublicLayout";

type LazyPageModule = Record<string, ComponentType>;

function loadRoute<TModule extends LazyPageModule>(
  importer: () => Promise<TModule>,
  exportName: keyof TModule
) {
  return async () => {
    const module = await importer();

    return {
      Component: module[exportName] as ComponentType,
    };
  };
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/login",
        lazy: loadRoute(() => import("@/auth/pages/LoginPage"), "LoginPage"),
      },
      {
        path: "/register",
        lazy: loadRoute(
          () => import("@/auth/pages/RegisterPage"),
          "RegisterPage"
        ),
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        lazy: loadRoute(
          () => import("@/dashboard/pages/DashboardPage"),
          "DashboardPage"
        ),
      },
      {
        path: "projects",
        lazy: loadRoute(
          () => import("@/projects/pages/ProjectsPage"),
          "ProjectsPage"
        ),
      },
      {
        path: "projects/:projectId",
        lazy: loadRoute(
          () => import("@/projects/pages/ProjectDetailPage"),
          "ProjectDetailPage"
        ),
      },
      {
        path: "tasks",
        lazy: loadRoute(() => import("@/tasks/pages/TasksPage"), "TasksPage"),
      },
      {
        path: "members",
        lazy: loadRoute(
          () => import("@/members/pages/MembersPage"),
          "MembersPage"
        ),
      },
      {
        path: "messages",
        lazy: loadRoute(
          () => import("@/messages/pages/MessagesPage"),
          "MessagesPage"
        ),
      },
      {
        path: "notifications",
        lazy: loadRoute(
          () => import("@/notifications/pages/NotificationsPage"),
          "NotificationsPage"
        ),
      },
      {
        path: "settings",
        lazy: loadRoute(
          () => import("@/settings/pages/SettingsPage"),
          "SettingsPage"
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
