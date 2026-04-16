import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, ArrowRightLeft, LogOut, PencilLine, Trash2, X } from "lucide-react";

import type { ProjectDetail } from "@/projects/types/project";
import { Button } from "@/shared/ui/button";

type ManageProjectModalProps = {
  open: boolean;
  project: ProjectDetail | null;
  currentUserId?: string | null;
  canManageProject?: boolean;
  canDeleteProject?: boolean;
  canTransferOwnership?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  isLeaving?: boolean;
  isTransferring?: boolean;
  onClose: () => void;
  onSave: (input: {
    projectId: string;
    name: string;
    description?: string;
  }) => Promise<unknown>;
  onDelete: (projectId: string) => Promise<unknown>;
  onLeaveProject: (projectId: string) => Promise<unknown>;
  onTransferOwnership: (input: {
    projectId: string;
    targetMemberId: string;
  }) => Promise<unknown>;
};

export function ManageProjectModal({
  open,
  project,
  currentUserId,
  canManageProject = false,
  canDeleteProject = false,
  canTransferOwnership = false,
  isSaving = false,
  isDeleting = false,
  isLeaving = false,
  isTransferring = false,
  onClose,
  onSave,
  onDelete,
  onLeaveProject,
  onTransferOwnership,
}: ManageProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [transferTargetId, setTransferTargetId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!project || !open) {
      return;
    }

    setName(project.name);
    setDescription(project.description ?? "");
    setDeleteConfirm("");
    setTransferTargetId("");
    setFormError(null);
  }, [open, project]);

  if (!open || !project) {
    return null;
  }

  const currentProject = project;
  const transferTargets = currentProject.members.filter(
    (member) => member.userId !== currentUserId
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      setFormError("Project name must be at least 3 characters.");
      return;
    }

    setFormError(null);
    await onSave({
      projectId: currentProject.id,
      name: trimmedName,
      description: description.trim() || undefined,
    });
    onClose();
  }

  async function handleDelete() {
    if (deleteConfirm.trim() !== currentProject.name) {
      setFormError("Type the project name exactly before deleting it.");
      return;
    }

    setFormError(null);
    await onDelete(currentProject.id);
  }

  async function handleTransferOwnership() {
    if (!transferTargetId) {
      setFormError("Select a member before transferring ownership.");
      return;
    }

    setFormError(null);
    await onTransferOwnership({
      projectId: currentProject.id,
      targetMemberId: transferTargetId,
    });
    onClose();
  }

  async function handleLeaveProject() {
    if (
      !window.confirm(
        `Leave "${currentProject.name}"? You will lose access to this project's tasks, messages, and members until someone adds you again.`
      )
    ) {
      return;
    }

    await onLeaveProject(currentProject.id);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-project-title"
    >
      <div className="w-full max-w-2xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Project settings
            </p>
            <h3 id="manage-project-title" className="mt-2 text-2xl font-semibold tracking-tight">
              Manage project
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Update the project details or remove the project if the workspace is no longer needed.
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSaving || isDeleting}
          >
            <X />
          </Button>
        </div>

        <form className="mt-6 flex flex-col gap-6" onSubmit={handleSave}>
          {canManageProject ? (
            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-border bg-secondary/60 p-2">
                  <PencilLine className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Project details</p>
                  <p className="text-xs text-muted-foreground">
                    Keep the name and description aligned with the current scope of the work.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Project name</span>
                  <input
                    className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={name}
                    onChange={(event) => {
                      setFormError(null);
                      setName(event.target.value);
                    }}
                    disabled={isSaving || isDeleting || isLeaving || isTransferring}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={description}
                    onChange={(event) => {
                      setFormError(null);
                      setDescription(event.target.value);
                    }}
                    disabled={isSaving || isDeleting || isLeaving || isTransferring}
                  />
                </label>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <p className="text-sm font-medium">Project access</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You can review this workspace and choose whether to stay in it, but project-wide settings remain restricted to owners and admins.
              </p>
            </section>
          )}

          {canTransferOwnership ? (
            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-border bg-secondary/60 p-2">
                  <ArrowRightLeft className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Transfer ownership</p>
                  <p className="text-xs text-muted-foreground">
                    Promote another active member to owner before you leave the project.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">New owner</span>
                  <select
                    className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={transferTargetId}
                    onChange={(event) => {
                      setFormError(null);
                      setTransferTargetId(event.target.value);
                    }}
                    disabled={isSaving || isDeleting || isLeaving || isTransferring}
                  >
                    <option value="">Select member</option>
                    {transferTargets.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name ?? member.email} ({member.email})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      transferTargets.length === 0 ||
                      isSaving ||
                      isDeleting ||
                      isLeaving ||
                      isTransferring
                    }
                    onClick={() => void handleTransferOwnership()}
                  >
                    {isTransferring ? "Transferring..." : "Transfer ownership"}
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border bg-secondary/60 p-2">
                <LogOut className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Leave project</p>
                <p className="text-xs text-muted-foreground">
                  Leave this workspace while keeping the project active for the rest of the team.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving || isDeleting || isLeaving || isTransferring}
                onClick={() => void handleLeaveProject()}
              >
                {isLeaving ? "Leaving..." : "Leave project"}
              </Button>
            </div>
          </section>

          {canDeleteProject ? (
            <section className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-destructive/20 bg-background p-2 text-destructive">
                <AlertTriangle className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Danger zone</p>
                <p className="text-xs text-muted-foreground">
                  Deleting a project permanently removes its tasks, messages, invitations, and memberships.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  Type <span className="font-semibold">{currentProject.name}</span> to confirm deletion
                </span>
                <input
                  className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={deleteConfirm}
                  onChange={(event) => {
                    setFormError(null);
                    setDeleteConfirm(event.target.value);
                  }}
                  disabled={isSaving || isDeleting || isLeaving || isTransferring}
                />
              </label>
            </div>
            </section>
          ) : null}

          {formError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {canDeleteProject ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={isSaving || isDeleting || isLeaving || isTransferring}
                onClick={() => void handleDelete()}
              >
                <Trash2 className="size-4" />
                {isDeleting ? "Deleting..." : "Delete project"}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving || isDeleting || isLeaving || isTransferring}
              >
                Cancel
              </Button>
              {canManageProject ? (
                <Button
                  type="submit"
                  disabled={isSaving || isDeleting || isLeaving || isTransferring}
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
