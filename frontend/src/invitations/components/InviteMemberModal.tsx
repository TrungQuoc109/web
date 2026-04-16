import { useState, type FormEvent } from "react";
import { Link2, X } from "lucide-react";

import { Button } from "@/shared/ui/button";

type InviteMemberModalProps = {
  open: boolean;
  projectName?: string | null;
  isPending?: boolean;
  onClose: () => void;
  onInvite: (input: { email: string }) => Promise<unknown>;
};

export function InviteMemberModal({
  open,
  projectName,
  isPending = false,
  onClose,
  onInvite,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!open) return null;

  function resetAndClose() {
    if (isPending) return;
    setEmail("");
    setSubmitError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setSubmitError("Enter an email address before creating an invitation.");
      return;
    }

    setSubmitError(null);

    try {
      await onInvite({ email: normalizedEmail });
      setEmail("");
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "The invitation could not be created. Please try again."
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-title"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Project invitation
            </p>
            <h3 id="invite-member-title" className="mt-2 text-2xl font-semibold tracking-tight">
              Invite by email
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Generate a join link for {projectName ?? "the selected project"} so
              a teammate can accept access after signing in.
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
              value={email}
              onChange={(event) => {
                setSubmitError(null);
                setEmail(event.target.value);
              }}
              placeholder="new.teammate@example.com"
              disabled={isPending}
            />
          </label>

          <div className="rounded-2xl border border-border bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 size-4 shrink-0" />
              <p>
                The backend will create a tokenized invitation. You can copy and
                share the generated link from the invitation list right after this step.
              </p>
            </div>
          </div>

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
              {isPending ? "Creating..." : "Create invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
