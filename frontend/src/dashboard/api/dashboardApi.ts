import type { DashboardActivity, DashboardOverview } from "@/dashboard/types/dashboard";
import { httpClient } from "@/shared/api/http-client";
import type { TaskStatus } from "@/shared/types/workspace";

type BackendProjectSummary = {
  id: number;
  updatedAt: string;
};

type BackendTaskSummary = {
  id: number;
  status: TaskStatus;
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
  recentActivity: BackendProjectActivity[];
};

type SortableDashboardActivity = DashboardActivity & {
  sortAt: number;
};

function createTaskStatusSummary(): Record<TaskStatus, number> {
  return {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
    BLOCKED: 0,
  };
}

function mapActivity(
  projectName: string,
  activity: BackendProjectActivity
): SortableDashboardActivity {
  const sortAt = new Date(activity.timestamp).getTime();

  return {
    id: `${projectName}-${activity.id}`,
    title: `${projectName} - ${activity.title}`,
    description: activity.description,
    timestamp: activity.timestamp,
    sortAt,
  };
}

async function getRecentActivity(
  projects: BackendProjectSummary[]
): Promise<DashboardActivity[]> {
  if (projects.length === 0) {
    return [];
  }

  const recentProjects = [...projects]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )
    .slice(0, 5);

  const detailResults = await Promise.allSettled(
    recentProjects.map(async (project) => {
      const response = await httpClient.get<BackendProjectDetail>(
        `/projects/${project.id}`
      );

      return response.data;
    })
  );

  const activities = detailResults.flatMap((result) => {
    if (result.status !== "fulfilled") {
      return [];
    }

    return result.value.recentActivity.map((activity) =>
      mapActivity(result.value.name, activity)
    );
  });

  return activities
    .sort((left, right) => right.sortAt - left.sortAt)
    .slice(0, 6)
    .map(({ sortAt: _sortAt, ...activity }) => activity);
}

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    const [projectsResponse, tasksResponse] = await Promise.all([
      httpClient.get<BackendProjectSummary[]>("/projects"),
      httpClient.get<BackendTaskSummary[]>("/tasks"),
    ]);

    const tasksByStatus = tasksResponse.data.reduce<Record<TaskStatus, number>>(
      (summary, task) => {
        summary[task.status] += 1;
        return summary;
      },
      createTaskStatusSummary()
    );

    return {
      totalProjects: projectsResponse.data.length,
      totalTasks: tasksResponse.data.length,
      tasksByStatus,
      recentActivity: await getRecentActivity(projectsResponse.data),
    };
  },
};
