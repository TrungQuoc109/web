import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import type { FilterDropdownOption } from "@/shared/ui/filter-dropdown-chip";
import { Board, boardColumns } from "@/tasks/components/Board";
import { CreateTaskModal } from "@/tasks/components/CreateTaskModal";
import { TaskFilters } from "@/tasks/components/TaskFilters";
import { TaskDetailDrawer } from "@/tasks/components/TaskDetailDrawer";
import { useAssignableUsers } from "@/tasks/hooks/useAssignableUsers";
import { useAssignTaskUsersMutation } from "@/tasks/hooks/useAssignTaskUsersMutation";
import { useCreateTaskMutation } from "@/tasks/hooks/useCreateTaskMutation";
import { useTaskComments } from "@/tasks/hooks/useTaskComments";
import { useDeleteTaskMutation } from "@/tasks/hooks/useDeleteTaskMutation";
import { useRemoveTaskAssignmentMutation } from "@/tasks/hooks/useRemoveTaskAssignmentMutation";
import { useTasksCatalog } from "@/tasks/hooks/useTasksCatalog";
import { useTaskReports } from "@/tasks/hooks/useTaskReports";
import { useSubmitTaskReportMutation } from "@/tasks/hooks/useSubmitTaskReportMutation";
import { useReviewTaskReportMutation } from "@/tasks/hooks/useReviewTaskReportMutation";
import { useSendTaskMessageMutation } from "@/tasks/hooks/useSendTaskMessageMutation";
import { useUpdateTaskAssignmentMutation } from "@/tasks/hooks/useUpdateTaskAssignmentMutation";
import { useUpdateTaskMutation } from "@/tasks/hooks/useUpdateTaskMutation";
import { useUpdateTaskStatusMutation } from "@/tasks/hooks/useUpdateTaskStatusMutation";
import type {
  TaskItem,
  TaskPriorityFilter,
  TaskStatus,
  TaskStatusFilter,
  TaskUser,
} from "@/tasks/types/task";
import { useProjects } from "@/projects/hooks/useProjects";
import type { Project } from "@/projects/types/project";
import { useAuthStore } from "@/auth/store/authStore";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { useToastStore } from "@/shared/lib/toast-store";

const statusOrder: TaskStatus[] = boardColumns.map((column) => column.key);

type TasksPageProps = {
  forcedProjectId?: string;
  projectName?: string;
  contextMode?: "workspace" | "tasks" | "board";
};

function getProjectFilterLabel(
  projects: Project[],
  value: string,
  fallbacks: { allProjects: string; selectedProject: string }
) {
  if (value === "ALL") {
    return fallbacks.allProjects;
  }

  return (
    projects.find((project) => project.id === value)?.name ??
    fallbacks.selectedProject
  );
}

function getAssigneeFilterLabel(
  assigneeFilter: string,
  users: TaskUser[],
  fallbacks: {
    anyone: string;
    assignedToMe: string;
    selectedTeammate: string;
  }
) {
  if (assigneeFilter === "ALL") {
    return fallbacks.anyone;
  }

  if (assigneeFilter === "ME") {
    return fallbacks.assignedToMe;
  }

  const matchedUser = users.find((user) => user.id === assigneeFilter);

  return (
    matchedUser?.name ??
    matchedUser?.email ??
    fallbacks.selectedTeammate
  );
}

export function TasksPage({ forcedProjectId }: TasksPageProps = {}) {
  const { language } = useI18n();
  const projectsQuery = useProjects();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>(forcedProjectId ?? "ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskCommentDrafts, setTaskCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const ui =
    language === "vi"
      ? {
          title: "Công việc",
          workspace: "Không gian làm việc",
          subtitle:
            "Không gian kanban để đẩy công việc qua từng giai đoạn delivery với bộ lọc gọn và khả năng cộng tác ngay trên từng task.",
          loadingTitle: "Công việc",
          loadingDescription: "Đang tải các cột board, thẻ task và bộ lọc.",
          unavailableTitle: "Không thể tải board công việc",
          unavailableDescription:
            "Không thể tải task board từ backend. Hãy thử lại để khôi phục chế độ kanban.",
          createTask: "Tạo task",
          matchingTasks: "task phù hợp",
          inFlight: "đang xử lý",
          blocked: "bị chặn",
          totalTasks: "Tổng task",
          totalTasksHelp: "Tất cả task hiện đang hiển thị trên board.",
          inProgressReview: "Đang làm / duyệt",
          inProgressReviewHelp: "Công việc đang được xử lý và chờ hoàn tất.",
          blockedHelp: "Các task đang chờ gỡ blocker hoặc đầu vào bên ngoài.",
          searchPlaceholder: "Tìm task hoặc người được giao",
          allProjects: "Tất cả dự án",
          allStatuses: "Tất cả trạng thái",
          allPriorities: "Tất cả ưu tiên",
          allAssignees: "Tất cả người phụ trách",
          assignedToMe: "Giao cho tôi",
          kanbanView: "Chế độ Kanban",
          visibleOnPage: "hiển thị trên trang này",
          project: "Dự án",
          status: "Trạng thái",
          priority: "Ưu tiên",
          assignee: "Người phụ trách",
          anyone: "Bất kỳ ai",
          selectedTeammate: "Đồng đội đã chọn",
          selectedProject: "Dự án đã chọn",
          search: "Tìm kiếm",
          resetFilters: "Äáº·t láº¡i",
          page: "Trang",
          of: "trên",
          noTasksTitle: "Chưa có task nào",
          noTasksDescription:
            "Khi công việc được tạo trong các dự án, board sẽ tự sắp xếp task theo giai đoạn delivery tại đây.",
          showing: "Hiển thị",
          previous: "Trước",
          next: "Sau",
          taskContextMissing: "Thiếu ngữ cảnh task",
          taskContextDescription:
            "Không thể xác định task đang chọn để cập nhật thông tin này.",
          priorities: {
            LOW: "Thấp",
            MEDIUM: "Trung bình",
            HIGH: "Cao",
            URGENT: "Khẩn cấp",
          } as Record<Exclude<TaskPriorityFilter, "ALL">, string>,
          statuses: {
            TODO: "Cần làm",
            IN_PROGRESS: "Đang làm",
            IN_REVIEW: "Đang duyệt",
            DONE: "Hoàn tất",
            BLOCKED: "Bị chặn",
          } as Record<TaskStatus, string>,
        }
      : {
          title: "Tasks",
          workspace: "Workspace",
          subtitle:
            "A kanban workspace for moving work across delivery stages with lightweight filters and task-level collaboration controls.",
          loadingTitle: "Tasks",
          loadingDescription: "Loading board columns, task cards, and filters.",
          unavailableTitle: "Task board unavailable",
          unavailableDescription:
            "The task board could not be loaded from the backend. Retry to restore the kanban view.",
          createTask: "Create task",
          matchingTasks: "matching tasks",
          inFlight: "in flight",
          blocked: "blocked",
          totalTasks: "Total tasks",
          totalTasksHelp: "All tasks currently visible in the board.",
          inProgressReview: "In progress / review",
          inProgressReviewHelp: "Work actively moving through delivery.",
          blockedHelp: "Tasks currently waiting on unblockers or external input.",
          searchPlaceholder: "Search tasks or assignees",
          allProjects: "All projects",
          allStatuses: "All statuses",
          allPriorities: "All priorities",
          allAssignees: "All assignees",
          assignedToMe: "Assigned to me",
          kanbanView: "Kanban view",
          visibleOnPage: "visible on this page",
          project: "Project",
          status: "Status",
          priority: "Priority",
          assignee: "Assignee",
          anyone: "Anyone",
          selectedTeammate: "Selected teammate",
          selectedProject: "Selected project",
          search: "Search",
          resetFilters: "Reset",
          page: "Page",
          of: "of",
          noTasksTitle: "No tasks yet",
          noTasksDescription:
            "Once work is created in your projects, the board will organize tasks by delivery stage here.",
          showing: "Showing",
          previous: "Previous",
          next: "Next",
          taskContextMissing: "Task context missing",
          taskContextDescription:
            "The selected task could not be resolved for this update.",
          priorities: {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            URGENT: "Urgent",
          } as Record<Exclude<TaskPriorityFilter, "ALL">, string>,
          statuses: {
            TODO: "To do",
            IN_PROGRESS: "In progress",
            IN_REVIEW: "In review",
            DONE: "Done",
            BLOCKED: "Blocked",
          } as Record<TaskStatus, string>,
        };
  const updateTaskStatus = useUpdateTaskStatusMutation();
  const assignTaskUsers = useAssignTaskUsersMutation();
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const updateTaskAssignment = useUpdateTaskAssignmentMutation();
  const removeTaskAssignment = useRemoveTaskAssignmentMutation();
  const submitTaskReport = useSubmitTaskReportMutation();
  const reviewTaskReport = useReviewTaskReportMutation();
  const sendTaskMessage = useSendTaskMessageMutation();
  const projects = projectsQuery.data ?? [];
  const deferredSearch = useDeferredValue(search);
  const canSelectProject = !forcedProjectId;
  const effectiveProjectFilter = forcedProjectId ?? projectFilter;
  const selectedProjectFilterId =
    effectiveProjectFilter !== "ALL" ? effectiveProjectFilter : undefined;
  const taskCatalogQuery = useTasksCatalog({
    search: deferredSearch,
    projectId: selectedProjectFilterId,
    status: statusFilter,
    priority: priorityFilter,
    assigneeId:
      assigneeFilter === "ALL"
        ? undefined
        : assigneeFilter === "ME"
          ? currentUser?.id
            ? String(currentUser.id)
            : undefined
          : assigneeFilter,
    page,
    pageSize: 24,
  });
  const tasksCatalog = taskCatalogQuery.data;
  const tasks = tasksCatalog?.items ?? [];
  const selectedTaskBase =
    selectedTaskId === null
      ? null
      : tasks.find((task) => task.id === selectedTaskId) ?? null;
  const taskCommentsQuery = useTaskComments(selectedTaskBase?.id);
  const taskReportsQuery = useTaskReports(selectedTaskBase?.id);
  const assignableUsersQuery = useAssignableUsers(selectedTaskBase?.projectId);
  const filterMembersQuery = useAssignableUsers(selectedProjectFilterId);
  const selectedTask = useMemo<TaskItem | null>(() => {
    if (!selectedTaskBase) {
      return null;
    }

    return {
      ...selectedTaskBase,
      comments: taskCommentsQuery.data ?? [],
    };
  }, [selectedTaskBase, taskCommentsQuery.data]);
  const availableUsers = useMemo(() => {
    if (!selectedTaskBase) {
      return [];
    }

    const assignedIds = new Set(selectedTaskBase.assignees.map((user) => user.id));
    return (assignableUsersQuery.data ?? []).filter((user) => !assignedIds.has(user.id));
  }, [assignableUsersQuery.data, selectedTaskBase]);
  const filterMemberOptions = filterMembersQuery.data ?? [];

  useEffect(() => {
    if (forcedProjectId) {
      setProjectFilter(forcedProjectId);
    }
  }, [forcedProjectId]);

  useEffect(() => {
    setPage(1);
  }, [assigneeFilter, deferredSearch, effectiveProjectFilter, priorityFilter, statusFilter]);

  useEffect(() => {
    if (
      effectiveProjectFilter === "ALL" &&
      assigneeFilter !== "ALL" &&
      assigneeFilter !== "ME"
    ) {
      setAssigneeFilter("ALL");
    }
  }, [assigneeFilter, effectiveProjectFilter]);

  const projectFilterOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: "ALL", label: ui.allProjects },
      ...projects.map((project) => ({
        value: project.id,
        label: project.name,
      })),
    ],
    [projects, ui.allProjects]
  );
  const statusFilterOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: "ALL", label: ui.allStatuses },
      ...statusOrder.map((status) => ({
        value: status,
        label: ui.statuses[status],
      })),
    ],
    [ui.allStatuses, ui.statuses]
  );
  const priorityFilterOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: "ALL", label: ui.allPriorities },
      { value: "LOW", label: ui.priorities.LOW },
      { value: "MEDIUM", label: ui.priorities.MEDIUM },
      { value: "HIGH", label: ui.priorities.HIGH },
      { value: "URGENT", label: ui.priorities.URGENT },
    ],
    [ui.allPriorities, ui.priorities]
  );
  const assigneeFilterOptions = useMemo<FilterDropdownOption[]>(
    () => [
      { value: "ALL", label: ui.anyone },
      { value: "ME", label: ui.assignedToMe },
      ...(selectedProjectFilterId
        ? filterMemberOptions.map((user) => ({
            value: user.id,
            label: user.name ?? user.email,
          }))
        : []),
    ],
    [
      filterMemberOptions,
      selectedProjectFilterId,
      ui.anyone,
      ui.assignedToMe,
    ]
  );
  const projectFilterLabel = getProjectFilterLabel(projects, effectiveProjectFilter, {
    allProjects: ui.allProjects,
    selectedProject: ui.selectedProject,
  });
  const assigneeFilterLabel = getAssigneeFilterLabel(assigneeFilter, filterMemberOptions, {
    anyone: ui.anyone,
    assignedToMe: ui.assignedToMe,
    selectedTeammate: ui.selectedTeammate,
  });
  const hasActiveFilters =
    Boolean(search.trim()) ||
    (canSelectProject && effectiveProjectFilter !== "ALL") ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL";

  function resetFilters() {
    setSearch("");
    if (canSelectProject) {
      setProjectFilter("ALL");
    }
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
  }

  function moveTask(taskId: string, direction: -1 | 1) {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;

    const currentIndex = statusOrder.indexOf(task.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= statusOrder.length) return;

    updateTaskStatus.mutate({
      taskId,
      status: statusOrder[nextIndex],
    });
  }

  function moveTaskToStatus(taskId: string, status: TaskStatus) {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task || task.status === status) {
      return;
    }

    updateTaskStatus.mutate({
      taskId,
      status,
    });
  }

  const summary = {
    total: tasksCatalog?.total ?? 0,
    inFlight: tasks.filter((task) =>
      ["IN_PROGRESS", "IN_REVIEW"].includes(task.status)
    ).length,
    blocked: tasks.filter((task) => task.status === "BLOCKED").length,
  };
  const selectedTaskCommentDraft =
    selectedTaskBase?.id ? taskCommentDrafts[selectedTaskBase.id] ?? "" : "";

  function updateTaskCommentDraft(taskId: string, draft: string) {
    setTaskCommentDrafts((current) => {
      if (!draft) {
        if (!(taskId in current)) {
          return current;
        }

        const next = { ...current };
        delete next[taskId];
        return next;
      }

      return {
        ...current,
        [taskId]: draft,
      };
    });
  }

  if (taskCatalogQuery.isPending && !tasksCatalog) {
    return (
      <LoadingState
        title={ui.loadingTitle}
        description={ui.loadingDescription}
        bodyClassName="h-[32rem]"
      />
    );
  }

  if (taskCatalogQuery.isError) {
    return (
      <ErrorState
        title={ui.unavailableTitle}
        description={ui.unavailableDescription}
        onRetry={() => void taskCatalogQuery.refetch()}
      />
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {ui.workspace}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">{ui.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {ui.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus />
            {ui.createTask}
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {summary.total} {ui.matchingTasks}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.inFlight} {ui.inFlight}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.blocked} {ui.blocked}
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{ui.totalTasks}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.total}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.totalTasksHelp}
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{ui.inProgressReview}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.inFlight}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.inProgressReviewHelp}
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{ui.blocked}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.blocked}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.blockedHelp}
          </p>
        </article>
      </section>

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={ui.searchPlaceholder}
        projectFilter={
          canSelectProject
            ? {
                label: ui.project,
                value: effectiveProjectFilter,
                currentLabel: projectFilterLabel,
                options: projectFilterOptions,
                onChange: setProjectFilter,
                defaultValue: "ALL",
              }
            : undefined
        }
        statusFilter={{
          label: ui.status,
          value: statusFilter,
          currentLabel:
            statusFilter === "ALL" ? ui.allStatuses : ui.statuses[statusFilter],
          options: statusFilterOptions,
          onChange: (value) => setStatusFilter(value as TaskStatusFilter),
          defaultValue: "ALL",
        }}
        priorityFilter={{
          label: ui.priority,
          value: priorityFilter,
          currentLabel:
            priorityFilter === "ALL"
              ? ui.allPriorities
              : ui.priorities[priorityFilter],
          options: priorityFilterOptions,
          onChange: (value) => setPriorityFilter(value as TaskPriorityFilter),
          defaultValue: "ALL",
        }}
        assigneeFilter={{
          label: ui.assignee,
          value: assigneeFilter,
          currentLabel: assigneeFilterLabel,
          options: assigneeFilterOptions,
          onChange: setAssigneeFilter,
          defaultValue: "ALL",
        }}
        visibleCount={tasks.length}
        visibleLabel={ui.visibleOnPage}
        viewLabel={ui.kanbanView}
        page={tasksCatalog?.page ?? 1}
        totalPages={tasksCatalog?.totalPages ?? 1}
        pageLabel={ui.page}
        ofLabel={ui.of}
        resetLabel={ui.resetFilters}
        showReset={hasActiveFilters}
        onReset={resetFilters}
      />

      {summary.total === 0 ? (
        <EmptyState
          icon={null}
          title={ui.noTasksTitle}
          description={ui.noTasksDescription}
          action={
            <Button
              type="button"
              className="gap-2"
              onClick={() => setIsCreateOpen(true)}
              disabled={projectsQuery.isPending || projects.length === 0}
            >
              <Plus />
              {ui.createTask}
            </Button>
          }
        />
      ) : (
        <>
          <Board
            tasks={tasks}
            onMoveLeft={(taskId) => moveTask(taskId, -1)}
            onMoveRight={(taskId) => moveTask(taskId, 1)}
            onMoveToStatus={moveTaskToStatus}
            onOpenTask={setSelectedTaskId}
          />

          <section className="flex flex-col gap-3 rounded-3xl border border-border bg-background/95 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {ui.showing}{" "}
              {summary.total === 0
                ? 0
                : ((tasksCatalog?.page ?? 1) - 1) *
                    (tasksCatalog?.pageSize ?? 24) +
                  1}
              -
              {Math.min(
                (tasksCatalog?.page ?? 1) * (tasksCatalog?.pageSize ?? 24),
                summary.total
              )}{" "}
              {ui.of} {summary.total} {ui.matchingTasks}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={(tasksCatalog?.page ?? 1) <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {ui.previous}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={(tasksCatalog?.page ?? 1) >= (tasksCatalog?.totalPages ?? 1)}
                onClick={() =>
                  setPage((current) =>
                    Math.min(tasksCatalog?.totalPages ?? current, current + 1)
                  )
                }
              >
                {ui.next}
              </Button>
            </div>
          </section>
        </>
      )}

      <TaskDetailDrawer
        task={selectedTask}
        availableUsers={availableUsers}
        reports={taskReportsQuery.data ?? []}
        commentDraft={selectedTaskCommentDraft}
        currentUserId={currentUser?.id ? String(currentUser.id) : null}
        isCommentsLoading={taskCommentsQuery.isPending}
        isUsersLoading={assignableUsersQuery.isPending}
        isReportsLoading={taskReportsQuery.isPending}
        isStatusUpdating={updateTaskStatus.isPending}
        isAssigningUser={assignTaskUsers.isPending}
        isUpdatingAssignment={updateTaskAssignment.isPending}
        isRemovingAssignment={removeTaskAssignment.isPending}
        isSendingComment={sendTaskMessage.isPending}
        isSubmittingReport={submitTaskReport.isPending}
        isReviewingReport={reviewTaskReport.isPending}
        isSavingTask={updateTask.isPending}
        isDeletingTask={deleteTask.isPending}
        canEditPriority
        open={selectedTask !== null}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={(taskId, status) => {
          updateTaskStatus.mutate({ taskId, status });
        }}
        onPriorityChange={(taskId, priority) => {
          if (!selectedTaskBase) {
            useToastStore.getState().push({
              title: ui.taskContextMissing,
              description: ui.taskContextDescription,
              variant: "error",
            });
            return;
          }

          updateTask.mutate({
            taskId,
            projectId: selectedTaskBase.projectId,
            title: selectedTaskBase.title,
            description: selectedTaskBase.description ?? undefined,
            priority,
          });
        }}
        onSaveTask={(taskId, input) =>
          updateTask.mutateAsync({
            taskId,
            projectId: selectedTaskBase?.projectId ?? "",
            title: input.title,
            description: input.description,
            priority: input.priority,
          })
        }
        onDeleteTask={async (taskId) => {
          await deleteTask.mutateAsync({
            taskId,
            projectId: selectedTaskBase?.projectId ?? "",
          });
          setSelectedTaskId(null);
        }}
        onAssignUser={(taskId, userId, role) => {
          assignTaskUsers.mutate({ taskId, userId, role });
        }}
        onUpdateAssignmentRole={(taskId, assignmentId, role) => {
          updateTaskAssignment.mutate({ taskId, assignmentId, role });
        }}
        onRemoveAssignment={(taskId, assignmentId) =>
          removeTaskAssignment.mutateAsync({
            taskId,
            assignmentId,
          })
        }
        onCommentDraftChange={updateTaskCommentDraft}
        onSendComment={(taskId, content) =>
          sendTaskMessage.mutateAsync({
            taskId,
            content,
          })
        }
        onSubmitReport={(taskId, input) =>
          submitTaskReport.mutateAsync({
            taskId,
            content: input.content,
            attachments: input.attachments,
          })
        }
        onReviewReport={(reportId, taskId, input) =>
          reviewTaskReport.mutateAsync({
            reportId,
            taskId,
            status: input.status,
            feedback: input.feedback,
            rejectionReason: input.rejectionReason,
          })
        }
      />

      <CreateTaskModal
        open={isCreateOpen}
        projects={projects}
        defaultProjectId={selectedTaskBase?.projectId}
        isPending={createTask.isPending}
        onClose={() => setIsCreateOpen(false)}
        onCreate={(input) => createTask.mutateAsync(input)}
      />
    </section>
  );
}
