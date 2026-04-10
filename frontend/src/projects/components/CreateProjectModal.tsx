import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import type { Project } from "@/projects/types/project";
import { Button } from "@/shared/ui/button";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
};

type FormState = {
  name: string;
  description: string;
  memberCount: string;
};

const initialState: FormState = {
  name: "",
  description: "",
  memberCount: "3",
};

export function CreateProjectModal({
  open,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  const [form, setForm] = useState<FormState>(initialState);

  if (!open) return null;

  function resetAndClose() {
    setForm(initialState);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();
    if (!name || !description) return;

    onCreate({
      id: `project-${Date.now()}`,
      name,
      description,
      memberCount: Number(form.memberCount) || 1,
      progress: 0,
      status: "PLANNING",
      updatedAt: "Just now",
    });

    resetAndClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              New project
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              Create project
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add a project shell now and connect it to backend actions later.
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={resetAndClose}
            aria-label="Close modal"
          >
            <X />
          </Button>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Project name</span>
            <input
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Website redesign"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              className="min-h-28 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Briefly describe the scope, team, or delivery goal."
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Initial member count</span>
            <input
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              type="number"
              min="1"
              max="99"
              value={form.memberCount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  memberCount: event.target.value,
                }))
              }
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit">Create project</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
