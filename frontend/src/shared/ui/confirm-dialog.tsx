import { useEffect, useRef } from "react";

import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/shared/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  isPending = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) {
      return;
    }

    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose, open]);

  if (!open) {
    return null;
  }

  const resolvedConfirmLabel = confirmLabel ?? t("confirmDialog.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("confirmDialog.cancel");
  const confirmClassName =
    tone === "danger"
      ? "border-destructive/30 text-destructive hover:bg-destructive/10"
      : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => {
        if (!isPending) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)] outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {t("confirmDialog.eyebrow")}
          </p>
          <h3 id="confirm-dialog-title" className="text-2xl font-semibold tracking-tight">
            {title}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            className={confirmClassName}
            disabled={isPending}
            onClick={() => void onConfirm()}
          >
            {isPending ? t("common.working") : resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
