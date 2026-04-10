import type { TaskItem, TaskUser } from "@/tasks/types/task";

export const taskUsers: TaskUser[] = [
  {
    id: "user-quoc",
    name: "Quoc Duong",
    email: "duongtrungquoc@gmail.com",
  },
  {
    id: "user-an",
    name: "An Nguyen",
    email: "an.nguyen@example.com",
  },
  {
    id: "user-mai",
    name: "Mai Le",
    email: "mai.le@example.com",
  },
  {
    id: "user-linh",
    name: "Linh Tran",
    email: "linh.tran@example.com",
  },
  {
    id: "user-bao",
    name: "Bao Ho",
    email: "bao.ho@example.com",
  },
  {
    id: "user-nhi",
    name: "Nhi Pham",
    email: "nhi.pham@example.com",
  },
];

export const tasksMock: TaskItem[] = [
  {
    id: "task-1",
    title: "Map onboarding edge cases",
    description:
      "Capture empty states, form failures, and permission scenarios for the first-time user path.",
    priority: "HIGH",
    status: "TODO",
    assignees: [taskUsers[0], taskUsers[5]],
    comments: [
      {
        id: "comment-1",
        author: "Quoc Duong",
        content: "Let’s keep this crisp so the next sprint planning stays grounded in real edge cases.",
        timestamp: "20 minutes ago",
      },
    ],
  },
  {
    id: "task-2",
    title: "Implement workspace sidebar states",
    description:
      "Ship hover, collapsed, and active states so the navigation feels complete on desktop and tablet.",
    priority: "URGENT",
    status: "IN_PROGRESS",
    assignees: [taskUsers[1], taskUsers[3]],
    comments: [
      {
        id: "comment-2",
        author: "Linh Tran",
        content: "The compact state is ready in design, now we just need motion polish in code.",
        timestamp: "1 hour ago",
      },
      {
        id: "comment-3",
        author: "An Nguyen",
        content: "I’ve finished the hover states and I’m wiring responsive behavior now.",
        timestamp: "34 minutes ago",
      },
    ],
  },
  {
    id: "task-3",
    title: "Review billing form validation",
    description:
      "Check error messaging, retry paths, and form persistence for edge-case billing submissions.",
    priority: "MEDIUM",
    status: "IN_REVIEW",
    assignees: [taskUsers[2]],
    comments: [
      {
        id: "comment-4",
        author: "Mai Le",
        content: "I found two validation mismatch cases. Sharing notes in the review thread.",
        timestamp: "12 minutes ago",
      },
    ],
  },
  {
    id: "task-4",
    title: "Finalize launch checklist",
    description:
      "Close the release readiness checklist for docs, QA, and the final product walkthrough.",
    priority: "LOW",
    status: "DONE",
    assignees: [taskUsers[3]],
    comments: [
      {
        id: "comment-5",
        author: "Linh Tran",
        content: "Everything is checked off. This one can stay as reference for the next launch.",
        timestamp: "Yesterday",
      },
    ],
  },
  {
    id: "task-5",
    title: "Unblock notification permission bug",
    description:
      "Investigate inconsistent permission prompts on Chromium and document a safe fallback flow.",
    priority: "HIGH",
    status: "BLOCKED",
    assignees: [taskUsers[4]],
    comments: [
      {
        id: "comment-6",
        author: "Bao Ho",
        content: "Blocked on browser-specific behavior. Waiting on a reproducible case from QA.",
        timestamp: "2 hours ago",
      },
    ],
  },
  {
    id: "task-6",
    title: "Polish project detail overview cards",
    description:
      "Refine spacing, metrics emphasis, and visual alignment for the overview section in project detail.",
    priority: "MEDIUM",
    status: "TODO",
    assignees: [taskUsers[5]],
    comments: [
      {
        id: "comment-7",
        author: "Nhi Pham",
        content: "I’ll start after the tasks board review is merged.",
        timestamp: "3 hours ago",
      },
    ],
  },
  {
    id: "task-7",
    title: "Connect projects list filtering",
    description:
      "Hook search and status controls into the mock list so the project page behaves like a real workspace.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignees: [taskUsers[3], taskUsers[0]],
    comments: [
      {
        id: "comment-8",
        author: "Quoc Duong",
        content: "Looks good so far. Let’s keep the filter labels simple for MVP.",
        timestamp: "55 minutes ago",
      },
    ],
  },
];

export const emptyTasksMock: TaskItem[] = [];
