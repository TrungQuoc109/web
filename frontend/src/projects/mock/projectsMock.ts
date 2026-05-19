import type { Project } from "@/projects/types/project";

export const projectsMock: Project[] = [
  {
    id: "project-phoenix",
    name: "Project Phoenix",
    description:
      "Platform redesign initiative covering onboarding, billing flow, and workspace navigation.",
    memberCount: 8,
    progress: 72,
    status: "ACTIVE",
    updatedAt: "Updated 18 minutes ago",
  },
  {
    id: "client-portal",
    name: "Client Portal",
    description:
      "Secure client-facing dashboard for approval flows, delivery tracking, and shared assets.",
    memberCount: 5,
    progress: 39,
    status: "PLANNING",
    updatedAt: "Updated 1 hour ago",
  },
  {
    id: "growth-site",
    name: "Growth Site Refresh",
    description:
      "Marketing website refresh with a new launch narrative, analytics instrumentation, and CMS cleanup.",
    memberCount: 4,
    progress: 84,
    status: "ACTIVE",
    updatedAt: "Updated 3 hours ago",
  },
  {
    id: "ops-migration",
    name: "Ops Migration",
    description:
      "Internal operations migration focused on permissions, reporting reliability, and rollout readiness.",
    memberCount: 6,
    progress: 57,
    status: "AT_RISK",
    updatedAt: "Updated yesterday",
  },
  {
    id: "mobile-alpha",
    name: "Mobile Alpha",
    description:
      "Early mobile experience for field teams with notifications, lightweight task updates, and offline sync prep.",
    memberCount: 3,
    progress: 100,
    status: "COMPLETED",
    updatedAt: "Updated 2 days ago",
  },
];

export const emptyProjectsMock: Project[] = [];

