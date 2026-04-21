import { CheckCircle2, Clock3, FileCheck2, XCircle } from "lucide-react";

import type { DashboardOverview } from "@/dashboard/types/dashboard";
import { Badge } from "@/shared/ui/badge";

type ReviewHealthCardProps = {
  reviewSummary: DashboardOverview["analytics"]["reviewSummary"];
};

export function ReviewHealthCard({ reviewSummary }: ReviewHealthCardProps) {
  const statusRows = [
    {
      label: "Pending",
      value: reviewSummary.pending,
      icon: Clock3,
      tone: "bg-amber-500/15 text-amber-700 border-amber-200/70",
    },
    {
      label: "Approved",
      value: reviewSummary.approved,
      icon: CheckCircle2,
      tone: "bg-emerald-500/15 text-emerald-700 border-emerald-200/70",
    },
    {
      label: "Rejected",
      value: reviewSummary.rejected,
      icon: XCircle,
      tone: "bg-rose-500/15 text-rose-700 border-rose-200/70",
    },
  ] as const;

  return (
    <section className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-border bg-secondary/60 p-3">
          <FileCheck2 />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Review health</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Approval quality and turnaround for task reports across the
            workspace.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Approval rate
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {reviewSummary.approvalRate}%
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Avg review time
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {reviewSummary.averageReviewHours === null
              ? "n/a"
              : `${reviewSummary.averageReviewHours}h`}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Pending now
          </p>
          <p className="mt-2 text-2xl font-semibold">{reviewSummary.pending}</p>
        </article>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {statusRows.map((row) => {
          const Icon = row.icon;
          const total =
            reviewSummary.pending +
            reviewSummary.approved +
            reviewSummary.rejected;
          const width = total === 0 ? 0 : Math.round((row.value / total) * 100);

          return (
            <article key={row.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl border px-2.5 py-2 ${row.tone}`}>
                    <Icon className="size-4" />
                  </div>
                  <p className="text-sm font-medium">{row.label}</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {row.value}
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-foreground/80 transition-[width]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
