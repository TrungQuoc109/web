import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedLayout } from "@/app/layouts/ProtectedLayout";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { LoginPage } from "@/auth/pages/LoginPage";
import { RegisterPage } from "@/auth/pages/RegisterPage";
import { DashboardPage } from "@/dashboard/pages/DashboardPage";
import { MessagesPage } from "@/messages/pages/MessagesPage";
import { MembersPage } from "@/members/pages/MembersPage";
import { NotificationsPage } from "@/notifications/pages/NotificationsPage";
import { ProjectDetailPage } from "@/projects/pages/ProjectDetailPage";
import { ProjectsPage } from "@/projects/pages/ProjectsPage";
import { SettingsPage } from "@/settings/pages/SettingsPage";
import { TasksPage } from "@/tasks/pages/TasksPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:projectId", element: <ProjectDetailPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "members", element: <MembersPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
