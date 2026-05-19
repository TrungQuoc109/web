import type { ProjectDetail } from "@/projects/types/project";

export const projectDetailMock: Record<string, ProjectDetail> = {
  "project-phoenix": {
    id: "project-phoenix",
    name: "Project Phoenix",
    description:
      "Platform redesign initiative covering onboarding, billing flow, and workspace navigation.",
    memberCount: 8,
    progress: 72,
    status: "ACTIVE",
    updatedAt: "Updated 18 minutes ago",
    totalTasks: 24,
    tasksByStatus: {
      TODO: 5,
      IN_PROGRESS: 8,
      IN_REVIEW: 4,
      DONE: 6,
      BLOCKED: 1,
    },
    recentActivity: [
      {
        id: "phoenix-activity-1",
        title: "Checkout redesign moved to review",
        description:
          "The billing experience update is ready for stakeholder review.",
        category: "TASK",
        actorName: "Linh Tran",
        metadata: null,
        timestamp: "14 minutes ago",
      },
      {
        id: "phoenix-activity-2",
        title: "Navigation audit shared",
        description:
          "Usability notes for the workspace sidebar were posted for the team.",
        category: "MESSAGE",
        actorName: "Quoc Duong",
        metadata: null,
        timestamp: "1 hour ago",
      },
      {
        id: "phoenix-activity-3",
        title: "Sprint planning finished",
        description:
          "Scope and owners for the next delivery batch were finalized.",
        category: "PROJECT",
        actorName: "Mai Le",
        metadata: null,
        timestamp: "Yesterday",
      },
    ],
    tasks: [
      {
        id: "phoenix-task-1",
        title: "Refine onboarding information architecture",
        assignee: {
          name: "Linh Tran",
          email: "linh.tran@example.com",
        },
        status: "IN_PROGRESS",
      },
      {
        id: "phoenix-task-2",
        title: "QA billing edge cases",
        assignee: {
          name: "An Nguyen",
          email: "an.nguyen@example.com",
        },
        status: "IN_REVIEW",
      },
      {
        id: "phoenix-task-3",
        title: "Ship workspace sidebar improvements",
        assignee: {
          name: "Quoc Duong",
          email: "duongtrungquoc@gmail.com",
        },
        status: "TODO",
      },
      {
        id: "phoenix-task-4",
        title: "Update account permissions copy",
        assignee: {
          name: "Mai Le",
          email: "mai.le@example.com",
        },
        status: "DONE",
      },
    ],
    members: [
      {
        id: "member-1",
        name: "Quoc Duong",
        role: "Product Owner",
        email: "duongtrungquoc@gmail.com",
      },
      {
        id: "member-2",
        name: "Linh Tran",
        role: "Product Designer",
        email: "linh.tran@example.com",
      },
      {
        id: "member-3",
        name: "An Nguyen",
        role: "Frontend Engineer",
        email: "an.nguyen@example.com",
      },
      {
        id: "member-4",
        name: "Mai Le",
        role: "QA Engineer",
        email: "mai.le@example.com",
      },
    ],
    messages: [
      {
        id: "message-1",
        author: {
          name: "Linh Tran",
          email: "linh.tran@example.com",
        },
        content: "The updated checkout states are ready for review this afternoon.",
        createdAt: "22 minutes ago",
      },
      {
        id: "message-2",
        author: {
          name: "Quoc Duong",
          email: "duongtrungquoc@gmail.com",
        },
        content: "Please keep the sidebar polish in this sprint so we can demo it Friday.",
        createdAt: "2 hours ago",
      },
    ],
  },
};
