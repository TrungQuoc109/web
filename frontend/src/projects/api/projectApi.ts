import { httpClient } from "@/shared/api/http-client";
import type {
  Project,
  ProjectActivity,
  ProjectDetail,
  ProjectMember,
  ProjectMessage,
  ProjectTask,
} from "@/projects/types/project";
import type { ProjectStatus, TaskStatus } from "@/shared/types/workspace";

type BackendProjectSummary = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  totalTasks: number;
  completedTaskCount: number;
  blockedTaskCount: number;
};

type BackendProjectMember = {
  id: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
};

type BackendProjectTask = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  assignee: {
    id: number;
    email: string;
    name: string | null;
  } | null;
};

type BackendProjectMessage = {
  id: number;
  content: string;
  createdAt: string;
  isSystem: boolean;
  isAnnouncement: boolean;
  sender: {
    id: number;
    email: string;
    name: string | null;
  } | null;
};

type BackendProjectActivity = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
};

type BackendProjectDetail = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasks: BackendProjectTask[];
  members: BackendProjectMember[];
  messages: BackendProjectMessage[];
  recentActivity: BackendProjectActivity[];
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
};

type BackendCreateProjectResponse = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return relativeTimeFormatter.format(diffDays, "day");
  }

  return date.toLocaleDateString();
}

function deriveProjectStatus(input: {
  totalTasks: number;
  completedTaskCount: number;
  blockedTaskCount: number;
}): ProjectStatus {
  if (input.totalTasks === 0) return "PLANNING";
  if (input.completedTaskCount === input.totalTasks) return "COMPLETED";
  if (input.blockedTaskCount > 0) return "AT_RISK";
  return "ACTIVE";
}

function deriveProgress(totalTasks: number, completedTaskCount: number) {
  if (totalTasks === 0) return 0;
  return Math.round((completedTaskCount / totalTasks) * 100);
}

function mapProjectSummary(project: BackendProjectSummary): Project {
  return {
    id: String(project.id),
    name: project.name,
    description: project.description ?? "No description yet.",
    memberCount: project.memberCount,
    progress: deriveProgress(project.totalTasks, project.completedTaskCount),
    status: deriveProjectStatus(project),
    updatedAt: `Updated ${formatRelativeTime(project.updatedAt)}`,
  };
}

function mapProjectMember(member: BackendProjectMember): ProjectMember {
  return {
    id: String(member.id),
    name: member.user.name ?? member.user.email,
    email: member.user.email,
    role: member.role,
  };
}

function mapProjectTask(task: BackendProjectTask): ProjectTask {
  return {
    id: String(task.id),
    title: task.title,
    assignee: task.assignee?.name ?? task.assignee?.email ?? "Unassigned",
    status: task.status,
  };
}

function mapProjectMessage(message: BackendProjectMessage): ProjectMessage {
  return {
    id: String(message.id),
    author: message.sender?.name ?? message.sender?.email ?? "System",
    content: message.content,
    timestamp: formatRelativeTime(message.createdAt),
  };
}

function mapProjectActivity(activity: BackendProjectActivity): ProjectActivity {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    timestamp: formatRelativeTime(activity.timestamp),
  };
}

function mapProjectDetail(project: BackendProjectDetail): ProjectDetail {
  const totalTasks = Object.values(project.tasksByStatus).reduce(
    (sum, count) => sum + count,
    0
  );
  const completedTaskCount = project.tasksByStatus.DONE ?? 0;
  const blockedTaskCount = project.tasksByStatus.BLOCKED ?? 0;

  return {
    id: String(project.id),
    name: project.name,
    description: project.description ?? "No description yet.",
    memberCount: project.memberCount,
    progress: deriveProgress(totalTasks, completedTaskCount),
    status: deriveProjectStatus({
      totalTasks,
      completedTaskCount,
      blockedTaskCount,
    }),
    updatedAt: `Updated ${formatRelativeTime(project.updatedAt)}`,
    totalTasks,
    tasksByStatus: project.tasksByStatus,
    recentActivity: project.recentActivity.map(mapProjectActivity),
    tasks: project.tasks.map(mapProjectTask),
    members: project.members.map(mapProjectMember),
    messages: project.messages.map(mapProjectMessage),
  };
}

export const projectApi = {
  async list(): Promise<Project[]> {
    const response = await httpClient.get<BackendProjectSummary[]>("/projects");
    return response.data.map(mapProjectSummary);
  },

  async getDetail(projectId: string): Promise<ProjectDetail | null> {
    const response = await httpClient.get<BackendProjectDetail>(
      `/projects/${projectId}`
    );
    return mapProjectDetail(response.data);
  },

  async create(payload: CreateProjectPayload): Promise<Project> {
    const response = await httpClient.post<BackendCreateProjectResponse>(
      "/projects",
      payload
    );

    return mapProjectSummary({
      ...response.data,
      memberCount: 1,
      totalTasks: 0,
      completedTaskCount: 0,
      blockedTaskCount: 0,
    });
  },
};
