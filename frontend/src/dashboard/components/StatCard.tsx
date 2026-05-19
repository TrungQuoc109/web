import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type StatCardProps = {
  label: string;
  value: number | string;
  helper?: string;
  icon?: ReactNode;
  tone?: "default" | "accent";
};

export function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "default",
}: StatCardProps) {
  return (
    <article
      className={cn(
        "rounded-3xl border border-border bg-background/95 p-5 shadow-sm",
        tone === "accent" &&
          "bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.95))]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon ? (
          <div className="rounded-2xl border border-border bg-secondary/70 p-3 text-foreground">
            {icon}
          </div>
        ) : null}
      </div>

      {helper ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{helper}</p>
      ) : null}
    </article>
  );
}

