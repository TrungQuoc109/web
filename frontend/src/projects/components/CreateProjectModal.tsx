import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/shared/ui/button";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; description?: string }) => Promise<void>;
  isPending?: boolean;
};

type FormState = {
  name: string;
  description: string;
};

const initialState: FormState = {
  name: "",
  description: "",
};

export function CreateProjectModal({
  open,
  onClose,
  onCreate,
  isPending = false,
}: CreateProjectModalProps) {
  const { t } = useI18n();
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

    const name = form.name.trim();
    const description = form.description.trim();
    if (!name) {
      setSubmitError(t("project.createModal.nameRequired"));
      return;
    }

    setSubmitError(null);

    try {
      await onCreate({
        name,
        description: description || undefined,
      });

      resetAndClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("project.createModal.createFailed")
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t("project.createModal.eyebrow")}
            </p>
            <h3 id="create-project-title" className="mt-2 text-2xl font-semibold tracking-tight">
              {t("project.createModal.title")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("project.createModal.subtitle")}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={resetAndClose}
            aria-label={t("project.createModal.close")}
            disabled={isPending}
          >
            <X />
          </Button>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("project.createModal.nameLabel")}</span>
            <input
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={form.name}
              onChange={(event) => {
                setSubmitError(null);
                setForm((current) => ({ ...current, name: event.target.value }));
              }}
              placeholder={t("project.createModal.namePlaceholder")}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("project.createModal.descriptionLabel")}</span>
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
              placeholder={t("project.createModal.descriptionPlaceholder")}
            />
          </label>

          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isPending}>
              {t("project.createModal.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("project.createModal.creating") : t("project.createModal.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
