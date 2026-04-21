import { BarChart3 } from "lucide-react";

import type { DashboardOverview } from "@/dashboard/types/dashboard";
import { Badge } from "@/shared/ui/badge";

type DeliveryTrendCardProps = {
  deliveryTrend: DashboardOverview["analytics"]["deliveryTrend"];
  momentum: DashboardOverview["analytics"]["momentum"];
};

const trendLegend = [
  { key: "created", label: "Created", className: "bg-slate-500/85" },
  { key: "completed", label: "Completed", className: "bg-emerald-500/85" },
  { key: "reviewed", label: "Reviewed", className: "bg-amber-500/85" },
] as const;

export function DeliveryTrendCard({
  deliveryTrend,
  momentum,
}: DeliveryTrendCardProps) {
  const maxValue = Math.max(
    1,
    ...deliveryTrend.flatMap((point) => [
      point.created,
      point.completed,
      point.reviewed,
    ])
  );

  return (
    <section className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-border bg-secondary/60 p-3">
            <BarChart3 />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Delivery momentum</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A seven-day read on incoming work, completed tasks, and reviewed
              reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {momentum.tasksCreatedLast7Days} created
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {momentum.tasksCompletedLast7Days} completed
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {momentum.reportsSubmittedLast7Days} reports
          </Badge>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {trendLegend.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-7 gap-3">
        {deliveryTrend.map((point) => (
          <article
            key={point.label}
            className="rounded-3xl border border-border bg-secondary/25 px-3 py-4"
          >
            <div className="flex h-32 items-end justify-center gap-1.5">
              {trendLegend.map((item) => {
                const value = point[item.key];
                const height = Math.max(10, Math.round((value / maxValue) * 96));

                return (
                  <div key={item.key} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-3 rounded-full transition-[height] ${item.className}`}
                      style={{ height: `${value === 0 ? 10 : height}px` }}
                      title={`${item.label}: ${value}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-medium">{point.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {point.completed} done / {point.reviewed} reviewed
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            New tasks
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.tasksCreatedLast7Days}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Completed
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.tasksCompletedLast7Days}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Reports filed
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.reportsSubmittedLast7Days}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Chat activity
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.projectMessagesLast7Days}
          </p>
        </article>
      </div>
    </section>
  );
}
