import type { ReactNode } from "react";

import { Badge } from "@/shared/ui/badge";

type ColumnProps = {
  title: string;
  count: number;
  isDropTarget?: boolean;
  onDragOver?: (event: React.DragEvent<HTMLElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (event: React.DragEvent<HTMLElement>) => void;
  children: ReactNode;
};

export function Column({
  title,
  count,
  isDropTarget = false,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: ColumnProps) {
  return (
    <section
      className={[
        "flex min-h-[28rem] w-[20rem] shrink-0 flex-col rounded-[1.75rem] border bg-background/85 shadow-sm transition-colors",
        isDropTarget ? "border-primary/50 bg-primary/5" : "border-border",
      ].join(" ")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
        <h3 className="text-sm font-semibold tracking-wide text-foreground">
          {title}
        </h3>
        <Badge variant="secondary">{count}</Badge>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-3">{children}</div>
    </section>
  );
}
