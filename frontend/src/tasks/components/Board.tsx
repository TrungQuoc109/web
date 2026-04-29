import { useState } from "react";

import { useI18n } from "@/i18n/useI18n";
import { Column } from "@/tasks/components/Column";
import { TaskCard } from "@/tasks/components/TaskCard";
import type { TaskItem, TaskStatus } from "@/tasks/types/task";

type BoardProps = {
  tasks: TaskItem[];
  onMoveLeft: (taskId: string) => void;
  onMoveRight: (taskId: string) => void;
  onMoveToStatus: (taskId: string, status: TaskStatus) => void;
  onOpenTask: (taskId: string) => void;
};

export const boardColumns: { key: TaskStatus; label: string }[] = [
  { key: "TODO", label: "TODO" },
  { key: "IN_PROGRESS", label: "IN_PROGRESS" },
  { key: "IN_REVIEW", label: "IN_REVIEW" },
  { key: "DONE", label: "DONE" },
  { key: "BLOCKED", label: "BLOCKED" },
];

export function Board({
  tasks,
  onMoveLeft,
  onMoveRight,
  onMoveToStatus,
  onOpenTask,
}: BoardProps) {
  const { language } = useI18n();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(null);
  const labels =
    language === "vi"
      ? {
          TODO: "Cần làm",
          IN_PROGRESS: "Đang làm",
          IN_REVIEW: "Đang duyệt",
          DONE: "Hoàn tất",
          BLOCKED: "Bị chặn",
          empty: "Chưa có task trong cột này",
          dragHint: "Kéo thả task giữa các cột để cập nhật trạng thái.",
        }
      : {
          TODO: "To do",
          IN_PROGRESS: "In progress",
          IN_REVIEW: "In review",
          DONE: "Done",
          BLOCKED: "Blocked",
          empty: "No tasks in this column",
          dragHint: "Drag tasks between columns to update status.",
        };

  function handleDrop(targetStatus: TaskStatus, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    const sourceStatus = event.dataTransfer.getData("text/task-status") as TaskStatus;

    setDropTargetStatus(null);
    setDraggingTaskId(null);

    if (!taskId || !sourceStatus || sourceStatus === targetStatus) {
      return;
    }

    onMoveToStatus(taskId, targetStatus);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <p className="mb-3 text-sm text-muted-foreground">{labels.dragHint}</p>
      <div className="flex min-w-max gap-4">
        {boardColumns.map((column, index) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);

          return (
            <Column
              key={column.key}
              title={labels[column.key]}
              count={columnTasks.length}
              isDropTarget={dropTargetStatus === column.key}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropTargetStatus(column.key);
              }}
              onDragLeave={() => {
                if (dropTargetStatus === column.key) {
                  setDropTargetStatus(null);
                }
              }}
              onDrop={(event) => handleDrop(column.key, event)}
            >
              {columnTasks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-10 text-center text-sm text-muted-foreground">
                  {labels.empty}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canMoveLeft={index > 0}
                    canMoveRight={index < boardColumns.length - 1}
                    isDragging={draggingTaskId === task.id}
                    onMoveLeft={onMoveLeft}
                    onMoveRight={onMoveRight}
                    onOpen={onOpenTask}
                    onDragStart={setDraggingTaskId}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setDropTargetStatus(null);
                    }}
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
