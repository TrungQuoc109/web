import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className="rounded-[2rem] border border-dashed border-border bg-background/80 px-8 py-16 text-center shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <div className="rounded-3xl border border-border bg-secondary/70 p-4">
          {icon}
        </div>
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {action}
      </div>
    </section>
  );
}

