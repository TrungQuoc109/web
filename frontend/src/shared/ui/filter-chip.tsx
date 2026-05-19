import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type FilterChipProps = {
  label: string;
  value: string;
  active?: boolean;
  interactive?: boolean;
  trailing?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function FilterChip({
  label,
  value,
  active = false,
  interactive = false,
  trailing,
  className,
  ...props
}: FilterChipProps) {
  return (
    <div
      className={cn(
        "inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
        active
          ? "border-primary/25 bg-primary/10 text-foreground shadow-sm"
          : "border-border bg-background text-foreground",
        interactive && "cursor-pointer hover:bg-accent",
        className
      )}
      {...props}
    >
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="truncate font-medium">{value}</span>
      {trailing}
    </div>
  );
}
