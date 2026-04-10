import { Column } from "@/tasks/components/Column";
import { TaskCard } from "@/tasks/components/TaskCard";
import type { TaskItem, TaskStatus } from "@/tasks/types/task";

type BoardProps = {
  tasks: TaskItem[];
  onMoveLeft: (taskId: string) => void;
  onMoveRight: (taskId: string) => void;
  onOpenTask: (taskId: string) => void;
};

export const boardColumns: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "TODO" },
  { key: "IN_PROGRESS", label: "IN_PROGRESS" },
  { key: "IN_REVIEW", label: "IN_REVIEW" },
  { key: "DONE", label: "DONE" },
  { key: "BLOCKED", label: "BLOCKED" },
];

export function Board({ tasks, onMoveLeft, onMoveRight, onOpenTask }: BoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {boardColumns.map((column, index) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);

          return (
            <Column key={column.key} title={column.label} count={columnTasks.length}>
              {columnTasks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-10 text-center text-sm text-muted-foreground">
                  No tasks in this column
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canMoveLeft={index > 0}
                    canMoveRight={index < boardColumns.length - 1}
                    onMoveLeft={onMoveLeft}
                    onMoveRight={onMoveRight}
                    onOpen={onOpenTask}
                  />
                ))
              )}
            </Column>
          );
        })}
      </div>
    </div>
  );
}
