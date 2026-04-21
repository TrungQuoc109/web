import { useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import type { Project } from "@/projects/types/project";
import type { TaskPriority } from "@/tasks/types/task";
import { Button } from "@/shared/ui/button";

type CreateTaskModalProps = {
  open: boolean;
  projects: Project[];
  defaultProjectId?: string;
  isPending?: boolean;
  onClose: () => void;
  onCreate: (input: {
    projectId: string;
    title: string;
    description?: string;
    priority: TaskPriority;
  }) => Promise<unknown>;
};

type FormState = {
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
};

const initialState: FormState = {
  projectId: "",
  title: "",
  description: "",
  priority: "MEDIUM",
};

const priorityOptions: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function CreateTaskModal({
  open,
  projects,
  defaultProjectId,
  isPending = false,
  onClose,
  onCreate,
}: CreateTaskModalProps) {
  const { language } = useI18n();
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const ui =
    language === "vi"
      ? {
          section: "Task mới",
          title: "Tạo task",
          subtitle: "Thêm task thật vào một dự án trong workspace backend đã kết nối.",
          close: "Đóng hộp thoại",
          project: "Dự án",
          noProjects: "Chưa có dự án nào",
          taskTitle: "Tiêu đề task",
          titlePlaceholder: "Chuẩn bị checklist demo sprint",
          priority: "Mức ưu tiên",
          description: "Mô tả",
          descriptionPlaceholder: "Mô tả mục tiêu, ghi chú nghiệm thu hoặc các ràng buộc.",
          missingProject: "Hãy chọn dự án và nhập tiêu đề task trước khi tạo.",
          createFailed: "Không thể tạo task. Vui lòng thử lại.",
          createProjectFirst: "Hãy tạo dự án trước rồi mới thêm task.",
          cancel: "Hủy",
          creating: "Đang tạo...",
          create: "Tạo task",
          priorities: {
            LOW: "Thấp",
            MEDIUM: "Trung bình",
            HIGH: "Cao",
            URGENT: "Khẩn cấp",
          } as Record<TaskPriority, string>,
        }
      : {
          section: "New task",
          title: "Create task",
          subtitle: "Add a real task to a project in the connected backend workspace.",
          close: "Close modal",
          project: "Project",
          noProjects: "No projects available",
          taskTitle: "Task title",
          titlePlaceholder: "Prepare sprint demo checklist",
          priority: "Priority",
          description: "Description",
          descriptionPlaceholder: "Outline the delivery goal, acceptance notes, or constraints.",
          missingProject: "Choose a project and enter a task title before creating.",
          createFailed: "The task could not be created. Please try again.",
          createProjectFirst: "Create a project first before adding tasks.",
          cancel: "Cancel",
          creating: "Creating...",
          create: "Create task",
          priorities: {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            URGENT: "Urgent",
          } as Record<TaskPriority, string>,
        };

  const effectiveProjectId = useMemo(
    () => form.projectId || defaultProjectId || projects[0]?.id || "",
    [defaultProjectId, form.projectId, projects]
  );

  if (!open) return null;

  function resetAndClose() {
    if (isPending) return;
    setForm(initialState);
    setSubmitError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    if (!title || !effectiveProjectId) {
      setSubmitError(ui.missingProject);
      return;
    }

    setSubmitError(null);

    try {
      await onCreate({
        projectId: effectiveProjectId,
        title,
        description: description || undefined,
        priority: form.priority,
      });
      setForm(initialState);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : ui.createFailed
      );
    }
  }

  const hasProjects = projects.length > 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {ui.section}
            </p>
            <h3 id="create-task-title" className="mt-2 text-2xl font-semibold tracking-tight">
              {ui.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {ui.subtitle}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={resetAndClose}
            aria-label={ui.close}
            disabled={isPending}
          >
            <X />
          </Button>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{ui.project}</span>
            <select
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={effectiveProjectId}
              onChange={(event) => {
                setSubmitError(null);
                setForm((current) => ({ ...current, projectId: event.target.value }));
              }}
              disabled={!hasProjects || isPending}
            >
              {hasProjects ? null : <option value="">{ui.noProjects}</option>}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{ui.taskTitle}</span>
            <input
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.title}
              onChange={(event) => {
                setSubmitError(null);
                setForm((current) => ({ ...current, title: event.target.value }));
              }}
              placeholder={ui.titlePlaceholder}
              disabled={isPending}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{ui.priority}</span>
            <select
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as TaskPriority,
                }))
              }
              disabled={isPending}
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {ui.priorities[priority]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{ui.description}</span>
            <textarea
              className="min-h-28 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.description}
              onChange={(event) => {
                setSubmitError(null);
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }));
              }}
              placeholder={ui.descriptionPlaceholder}
              disabled={isPending}
            />
          </label>

          {!hasProjects ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
              {ui.createProjectFirst}
            </div>
          ) : null}

          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isPending}>
              {ui.cancel}
            </Button>
            <Button type="submit" disabled={!hasProjects || isPending}>
              {isPending ? ui.creating : ui.create}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
