import { httpClient } from "@/shared/api/http-client";
import type {
  Project,
  ProjectActivity,
  ProjectsCatalog,
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
  category: "PROJECT" | "MEMBER" | "MESSAGE" | "TASK" | "REPORT" | "INVITATION";
  actorName: string | null;
  metadata: Record<string, unknown> | null;
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

export type UpdateProjectPayload = {
  projectId: string;
  name: string;
  description?: string;
};

export type TransferProjectOwnershipPayload = {
  projectId: string;
  targetMemberId: string;
};

export type ListProjectsCatalogFilters = {
  search?: string;
  status?: Exclude<ProjectStatus, never>;
  page?: number;
  pageSize?: number;
};

type BackendCreateProjectResponse = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendProjectsCatalogResponse = {
  items: BackendProjectSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

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
    description: project.description,
    memberCount: project.memberCount,
    progress: deriveProgress(project.totalTasks, project.completedTaskCount),
    status: deriveProjectStatus(project),
    updatedAt: project.updatedAt,
  };
}

function mapProjectMember(member: BackendProjectMember): ProjectMember {
  return {
    id: String(member.id),
    userId: String(member.user.id),
    name: member.user.name,
    email: member.user.email,
    role: member.role,
  };
}

function mapProjectTask(task: BackendProjectTask): ProjectTask {
  return {
    id: String(task.id),
    title: task.title,
    assignee: task.assignee,
    status: task.status,
  };
}

function mapProjectMessage(message: BackendProjectMessage): ProjectMessage {
  return {
    id: String(message.id),
    author: message.sender,
    content: message.content,
    createdAt: message.createdAt,
  };
}

function mapProjectActivity(activity: BackendProjectActivity): ProjectActivity {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    category: activity.category,
    actorName: activity.actorName,
    metadata: activity.metadata,
    timestamp: activity.timestamp,
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
    description: project.description,
    memberCount: project.memberCount,
    progress: deriveProgress(totalTasks, completedTaskCount),
    status: deriveProjectStatus({
      totalTasks,
      completedTaskCount,
      blockedTaskCount,
    }),
    updatedAt: project.updatedAt,
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

  async listCatalog(
    filters: ListProjectsCatalogFilters
  ): Promise<ProjectsCatalog> {
    const response = await httpClient.get<BackendProjectsCatalogResponse>(
      "/projects/catalog",
      {
        params: {
          search: filters.search,
          status: filters.status,
          page: filters.page,
          pageSize: filters.pageSize,
        },
      }
    );

    return {
      items: response.data.items.map(mapProjectSummary),
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    };
  },

  async getDetail(projectId: string): Promise<ProjectDetail | null> {
    const response = await httpClient.get<BackendProjectDetail>(
      `/projects/${projectId}`
    );
    return mapProjectDetail(response.data);
  },

  async getActivity(projectId: string): Promise<ProjectActivity[]> {
    const response = await httpClient.get<BackendProjectActivity[]>(
      `/projects/${projectId}/activity`
    );
    return response.data.map(mapProjectActivity);
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

  async update(payload: UpdateProjectPayload): Promise<Project> {
    const response = await httpClient.patch<BackendCreateProjectResponse>(
      `/projects/${payload.projectId}`,
      {
        name: payload.name,
        description: payload.description,
      }
    );

    return mapProjectSummary({
      ...response.data,
      memberCount: 0,
      totalTasks: 0,
      completedTaskCount: 0,
      blockedTaskCount: 0,
    });
  },

  async remove(projectId: string): Promise<void> {
    await httpClient.delete(`/projects/${projectId}`);
  },

  async leave(projectId: string): Promise<void> {
    await httpClient.post(`/projects/${projectId}/leave`);
  },

  async transferOwnership(
    payload: TransferProjectOwnershipPayload
  ): Promise<void> {
    await httpClient.post(`/projects/${payload.projectId}/ownership-transfer`, {
      targetMemberId: Number(payload.targetMemberId),
    });
  },
};
