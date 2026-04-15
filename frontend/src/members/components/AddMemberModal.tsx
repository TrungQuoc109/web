import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import type { MemberRole } from "@/members/types/member";
import { Button } from "@/shared/ui/button";

type AddMemberModalProps = {
  open: boolean;
  projectName?: string | null;
  isPending?: boolean;
  onClose: () => void;
  onAdd: (input: { email: string; role: MemberRole }) => Promise<unknown>;
};

type FormState = {
  email: string;
  role: MemberRole;
};

const initialState: FormState = {
  email: "",
  role: "MEMBER",
};

const roleOptions: MemberRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export function AddMemberModal({
  open,
  projectName,
  isPending = false,
  onClose,
  onAdd,
}: AddMemberModalProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!open) return null;

  function resetAndClose() {
    if (isPending) return;
    setForm(initialState);
    setSubmitError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = form.email.trim();
    if (!email) {
      setSubmitError("Enter an email address before adding a member.");
      return;
    }

    setSubmitError(null);

    try {
      await onAdd({
        email,
        role: form.role,
      });
      setForm(initialState);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The member could not be added. Please try again."
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Project member
            </p>
            <h3 id="add-member-title" className="mt-2 text-2xl font-semibold tracking-tight">
              Add member
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Invite an existing user into {projectName ?? "the selected project"} with a project role.
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={resetAndClose}
            aria-label="Close modal"
            disabled={isPending}
          >
            <X />
          </Button>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.email}
              onChange={(event) => {
                setSubmitError(null);
                setForm((current) => ({ ...current, email: event.target.value }));
              }}
              placeholder="teammate@example.com"
              disabled={isPending}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Role</span>
            <select
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as MemberRole,
                }))
              }
              disabled={isPending}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
