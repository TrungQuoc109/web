import { useEffect, useState } from "react";
import { LayoutGrid, Search } from "lucide-react";

import { Board, boardColumns } from "@/tasks/components/Board";
import { TaskDetailDrawer } from "@/tasks/components/TaskDetailDrawer";
import { useTaskBoard } from "@/tasks/hooks/useTaskBoard";
import { taskUsers } from "@/tasks/mock/tasksMock";
import type { TaskItem, TaskPriorityFilter, TaskStatus } from "@/tasks/types/task";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";

const statusOrder: TaskStatus[] = boardColumns.map((column) => column.key);

export function TasksPage() {
  const taskBoardQuery = useTaskBoard();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (taskBoardQuery.data) {
      setTasks(taskBoardQuery.data);
    }
  }, [taskBoardQuery.data]);

  function moveTask(taskId: string, direction: -1 | 1) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;

        const currentIndex = statusOrder.indexOf(task.status);
        const nextIndex = currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= statusOrder.length) return task;

        return {
          ...task,
          status: statusOrder[nextIndex],
        };
      })
    );
  }

  const filteredTasks = tasks.filter((task) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === ""
        ? true
        : task.title.toLowerCase().includes(normalizedSearch) ||
          task.assignees.some(
            (assignee) =>
              assignee.name.toLowerCase().includes(normalizedSearch) ||
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
  const selectedTask =
    selectedTaskId === null
      ? null
      : tasks.find((task) => task.id === selectedTaskId) ?? null;

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
        description="The mock board did not load correctly. Retry to restore the kanban view."
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
            A compact kanban board for moving work across delivery stages, with
            lightweight controls inspired by Trello and Jira.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
              <LayoutGrid />
              Mini Jira board
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
          description="Once work is created, the board will organize tasks by delivery stage here."
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
        availableUsers={taskUsers}
        open={selectedTask !== null}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={(taskId, status) => {
          setTasks((current) =>
            current.map((task) => (task.id === taskId ? { ...task, status } : task))
          );
        }}
        onPriorityChange={(taskId, priority) => {
          setTasks((current) =>
            current.map((task) =>
              task.id === taskId ? { ...task, priority } : task
            )
          );
        }}
        onAssignUser={(taskId, userId) => {
          const user = taskUsers.find((candidate) => candidate.id === userId);
          if (!user) return;

          setTasks((current) =>
            current.map((task) => {
              if (task.id !== taskId) return task;
              if (task.assignees.some((assignee) => assignee.id === user.id)) {
                return task;
              }

              return {
                ...task,
                assignees: [...task.assignees, user],
              };
            })
          );
        }}
      />
    </section>
  );
}
