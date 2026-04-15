import { ChevronLeft, ChevronRight } from "lucide-react";

import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { getDisplayName } from "@/shared/lib/display";
import { PriorityBadge } from "@/shared/ui/priority-badge";
import type { TaskItem, TaskStatus } from "@/tasks/types/task";

type TaskCardProps = {
  task: TaskItem;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: (taskId: string) => void;
  onMoveRight: (taskId: string) => void;
  onOpen: (taskId: string) => void;
};

const statusAccent: Record<TaskStatus, string> = {
  TODO: "bg-slate-500/70",
  IN_PROGRESS: "bg-sky-500/70",
  IN_REVIEW: "bg-amber-500/70",
  DONE: "bg-emerald-500/70",
  BLOCKED: "bg-rose-500/70",
};

export function TaskCard({
  task,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onOpen,
}: TaskCardProps) {
  const primaryAssignee = task.assignees[0];

  return (
    <article
      className="cursor-pointer rounded-2xl border border-border bg-background p-4 shadow-sm transition-transform hover:-translate-y-0.5"
      onClick={() => onOpen(task.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-1 h-10 w-1.5 rounded-full", statusAccent[task.status])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold leading-6 text-foreground">
              {task.title}
            </h4>
            <PriorityBadge priority={task.priority} className="shrink-0" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={primaryAssignee?.name}
                email={primaryAssignee?.email}
                className="size-9 shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {getDisplayName(primaryAssignee, "Unassigned")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {task.assignees.length > 1
                    ? `+${task.assignees.length - 1} more assignees`
                    : primaryAssignee?.email || "No assignee yet"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={!canMoveLeft}
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveLeft(task.id);
                }}
                aria-label={`Move ${task.title} left`}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={!canMoveRight}
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveRight(task.id);
                }}
                aria-label={`Move ${task.title} right`}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
