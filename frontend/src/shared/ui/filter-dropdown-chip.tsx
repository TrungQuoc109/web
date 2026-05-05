import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { FilterChip } from "@/shared/ui/filter-chip";

export type FilterDropdownOption = {
  value: string;
  label: string;
};

type FilterDropdownChipProps = {
  label: string;
  value: string;
  currentLabel: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

export function FilterDropdownChip({
  label,
  value,
  currentLabel,
  options,
  onChange,
  active = false,
  disabled = false,
  className,
}: FilterDropdownChipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative max-w-full", className)}>
      <button
        type="button"
        className="max-w-full"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <FilterChip
          label={label}
          value={currentLabel}
          active={active}
          interactive={!disabled}
          className={cn(disabled && "cursor-not-allowed opacity-60")}
          trailing={
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          }
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-20 max-h-80 min-w-[15rem] max-w-[calc(100vw-2rem)] overflow-auto rounded-2xl border border-border bg-background p-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {selected ? <Check className="size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
