import { X } from "lucide-react";

import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { getDisplayName, getDisplayText } from "@/shared/lib/display";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { PriorityBadge } from "@/shared/ui/priority-badge";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { TaskItem, TaskStatus, TaskUser } from "@/tasks/types/task";
import type { TaskPriority } from "@/shared/types/workspace";

type TaskDetailDrawerProps = {
  task: TaskItem | null;
  availableUsers: TaskUser[];
  isCommentsLoading?: boolean;
  isUsersLoading?: boolean;
  isStatusUpdating?: boolean;
  isAssigningUser?: boolean;
  canEditPriority?: boolean;
  open: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onAssignUser: (taskId: string, userId: string) => void;
};

const statusOptions: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "BLOCKED",
];

const priorityOptions: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export function TaskDetailDrawer({
  task,
  availableUsers,
  isCommentsLoading = false,
  isUsersLoading = false,
  isStatusUpdating = false,
  isAssigningUser = false,
  canEditPriority = true,
  open,
  onClose,
  onStatusChange,
  onPriorityChange,
  onAssignUser,
}: TaskDetailDrawerProps) {
  if (!open || !task) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-[0_0_60px_-20px_rgba(15,23,42,0.35)]">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-6">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Task detail
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {task.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getDisplayText(task.description, "No description yet.")}
            </p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
                <p className="text-sm font-medium">Status</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Move the task through the delivery flow.
                </p>
                <div className="mt-4">
                  <StatusBadge value={task.status} />
                </div>
                <select
                  className="mt-4 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={task.status}
                  disabled={isStatusUpdating}
                  onChange={(event) =>
                    onStatusChange(task.id, event.target.value as TaskStatus)
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
                <p className="text-sm font-medium">Priority</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update urgency based on delivery impact.
                </p>
                <div className="mt-4">
                  <PriorityBadge priority={task.priority} />
                </div>
                <select
                  className="mt-4 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={task.priority}
                  disabled={!canEditPriority}
                  onChange={(event) =>
                    onPriorityChange(task.id, event.target.value as TaskPriority)
                  }
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
                {!canEditPriority ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Priority updates are not available yet because the backend
                    does not expose an update endpoint for this field.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Assignees</h3>
                <p className="text-sm text-muted-foreground">
                  Assign more teammates to the task from the current project member list.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {task.assignees.length === 0 ? (
                  <Badge variant="outline">No assignees yet</Badge>
                ) : (
                  task.assignees.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-3 py-2"
                    >
                      <Avatar name={user.name} email={user.email} className="size-8" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {getDisplayName(user, user.email)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Assign user</span>
                  <select
                    className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue=""
                    disabled={isUsersLoading || isAssigningUser}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) return;
                      onAssignUser(task.id, value);
                      event.target.value = "";
                    }}
                  >
                    <option value="">Select teammate</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {getDisplayName(user, user.email)}
                      </option>
                    ))}
                  </select>
                  {isUsersLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Loading project members...
                    </p>
                  ) : null}
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Comments</h3>
                <p className="text-sm text-muted-foreground">
                  Recent task discussion and system updates from the backend.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {isCommentsLoading ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading comments...
                  </div>
                ) : task.comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-8 text-center text-sm text-muted-foreground">
                    No comments yet
                  </div>
                ) : (
                  task.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-2xl border border-border bg-secondary/25 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">
                          {getDisplayName(comment.author, "System")}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {formatRelativeDate(comment.createdAt)}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {comment.content}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}
