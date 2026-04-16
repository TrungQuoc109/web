import { useMemo, useState } from "react";
import { LayoutGrid, Plus, Search } from "lucide-react";

import { Board, boardColumns } from "@/tasks/components/Board";
import { CreateTaskModal } from "@/tasks/components/CreateTaskModal";
import { TaskDetailDrawer } from "@/tasks/components/TaskDetailDrawer";
import { useAssignableUsers } from "@/tasks/hooks/useAssignableUsers";
import { useAssignTaskUsersMutation } from "@/tasks/hooks/useAssignTaskUsersMutation";
import { useCreateTaskMutation } from "@/tasks/hooks/useCreateTaskMutation";
import { useTaskComments } from "@/tasks/hooks/useTaskComments";
import { useDeleteTaskMutation } from "@/tasks/hooks/useDeleteTaskMutation";
import { useTaskBoard } from "@/tasks/hooks/useTaskBoard";
import { useTaskReports } from "@/tasks/hooks/useTaskReports";
import { useSubmitTaskReportMutation } from "@/tasks/hooks/useSubmitTaskReportMutation";
import { useReviewTaskReportMutation } from "@/tasks/hooks/useReviewTaskReportMutation";
import { useSendTaskMessageMutation } from "@/tasks/hooks/useSendTaskMessageMutation";
import { useUpdateTaskMutation } from "@/tasks/hooks/useUpdateTaskMutation";
import { useUpdateTaskStatusMutation } from "@/tasks/hooks/useUpdateTaskStatusMutation";
import type { TaskItem, TaskPriorityFilter, TaskStatus } from "@/tasks/types/task";
import { useProjects } from "@/projects/hooks/useProjects";
import { useAuthStore } from "@/auth/store/authStore";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import { useToastStore } from "@/shared/lib/toast-store";

const statusOrder: TaskStatus[] = boardColumns.map((column) => column.key);

export function TasksPage() {
  const taskBoardQuery = useTaskBoard();
  const projectsQuery = useProjects();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskCommentDrafts, setTaskCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const updateTaskStatus = useUpdateTaskStatusMutation();
  const assignTaskUsers = useAssignTaskUsersMutation();
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const submitTaskReport = useSubmitTaskReportMutation();
  const reviewTaskReport = useReviewTaskReportMutation();
  const sendTaskMessage = useSendTaskMessageMutation();
  const tasks = taskBoardQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const selectedTaskBase =
    selectedTaskId === null
      ? null
      : tasks.find((task) => task.id === selectedTaskId) ?? null;
  const taskCommentsQuery = useTaskComments(selectedTaskBase?.id);
  const taskReportsQuery = useTaskReports(selectedTaskBase?.id);
  const assignableUsersQuery = useAssignableUsers(selectedTaskBase?.projectId);
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

  const filteredTasks = tasks.filter((task) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === ""
        ? true
        : task.title.toLowerCase().includes(normalizedSearch) ||
          task.assignees.some(
            (assignee) =>
              (assignee.name ?? "").toLowerCase().includes(normalizedSearch) ||
              assignee.email.toLowerCase().includes(normalizedSearch)
          );
    const matchesPriority =
      priorityFilter === "ALL" ? true : task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const summary = {
    total: tasks.length,
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

  if (taskBoardQuery.isPending) {
    return (
      <LoadingState
        title="Tasks"
        description="Loading board columns, task cards, and filters."
        bodyClassName="h-[32rem]"
      />
    );
  }

  if (taskBoardQuery.isError) {
    return (
      <ErrorState
        title="Task board unavailable"
        description="The task board could not be loaded from the backend. Retry to restore the kanban view."
        onRetry={() => void taskBoardQuery.refetch()}
      />
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Tasks</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            A kanban workspace for moving work across delivery stages with
            lightweight filters and task-level collaboration controls.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus />
            Create task
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {summary.total} tasks
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.inFlight} in flight
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {summary.blocked} blocked
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total tasks</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.total}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            All tasks currently visible in the board.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">In progress / review</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.inFlight}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Work actively moving through delivery.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Blocked</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.blocked}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Tasks currently waiting on unblockers or external input.
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks or assignees"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as TaskPriorityFilter)
              }
            >
              <option value="ALL">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <LayoutGrid className="size-4" />
              Kanban view
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredTasks.length} visible
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Filter: {priorityFilter === "ALL" ? "All priorities" : priorityFilter}
          </Badge>
          {search ? (
            <Badge variant="outline" className="px-3 py-1">
              Search: {search}
            </Badge>
          ) : null}
        </div>
      </section>

      {tasks.length === 0 ? (
        <EmptyState
          icon={null}
          title="No tasks yet"
          description="Once work is created in your projects, the board will organize tasks by delivery stage here."
          action={
            <Button
              type="button"
              className="gap-2"
              onClick={() => setIsCreateOpen(true)}
              disabled={projectsQuery.isPending || projects.length === 0}
            >
              <Plus />
              Create task
            </Button>
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={null}
          title="No tasks match the current filters"
          description="Adjust the search text or selected priority to bring matching tasks back into view."
        />
      ) : (
        <Board
          tasks={filteredTasks}
          onMoveLeft={(taskId) => moveTask(taskId, -1)}
          onMoveRight={(taskId) => moveTask(taskId, 1)}
          onOpenTask={setSelectedTaskId}
        />
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
              title: "Task context missing",
              description: "The selected task could not be resolved for this update.",
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
