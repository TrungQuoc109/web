import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  it("uses translated fallback labels and triggers actions", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Delete task"
        description="Remove this task permanently?"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows working state while pending", () => {
    render(
      <ConfirmDialog
        open
        title="Delete task"
        description="Remove this task permanently?"
        isPending
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Working..." })).toBeDisabled();
  });
});
