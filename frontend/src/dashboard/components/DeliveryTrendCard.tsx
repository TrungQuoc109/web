import { BarChart3 } from "lucide-react";

import type { DashboardOverview } from "@/dashboard/types/dashboard";
import { useI18n } from "@/i18n/useI18n";
import { Badge } from "@/shared/ui/badge";

type DeliveryTrendCardProps = {
  deliveryTrend: DashboardOverview["analytics"]["deliveryTrend"];
  momentum: DashboardOverview["analytics"]["momentum"];
};

const trendLegend = [
  { key: "created", labelKey: "dashboard.cards.deliveryTrend.legend.created", className: "bg-slate-500/85" },
  { key: "completed", labelKey: "dashboard.cards.deliveryTrend.legend.completed", className: "bg-emerald-500/85" },
  { key: "reviewed", labelKey: "dashboard.cards.deliveryTrend.legend.reviewed", className: "bg-amber-500/85" },
] as const;

export function DeliveryTrendCard({
  deliveryTrend,
  momentum,
}: DeliveryTrendCardProps) {
  const { t, locale } = useI18n();

  function formatTrendLabel(label: string) {
    const normalized = label.trim();
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    }

    const token = normalized.slice(0, 3).toLowerCase();
    const weekdayKey =
      token === "mon" ||
      token === "tue" ||
      token === "wed" ||
      token === "thu" ||
      token === "fri" ||
      token === "sat" ||
      token === "sun"
        ? token
        : null;

    return weekdayKey ? t(`common.weekdayShort.${weekdayKey}`) : normalized;
  }

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
            <h3 className="text-lg font-semibold">{t("dashboard.cards.deliveryTrend.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.cards.deliveryTrend.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {t("dashboard.cards.deliveryTrend.badgeCreated", {
              count: momentum.tasksCreatedLast7Days,
            })}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {t("dashboard.cards.deliveryTrend.badgeCompleted", {
              count: momentum.tasksCompletedLast7Days,
            })}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {t("dashboard.cards.deliveryTrend.badgeReports", {
              count: momentum.reportsSubmittedLast7Days,
            })}
          </Badge>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {trendLegend.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
            <span>{t(item.labelKey)}</span>
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
                const label = t(item.labelKey);

                return (
                  <div key={item.key} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-3 rounded-full transition-[height] ${item.className}`}
                      style={{ height: `${value === 0 ? 10 : height}px` }}
                      title={`${label}: ${value}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm font-medium">{formatTrendLabel(point.label)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("dashboard.cards.deliveryTrend.daySummary", {
                  done: point.completed,
                  reviewed: point.reviewed,
                })}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {t("dashboard.cards.deliveryTrend.tiles.newTasks")}
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.tasksCreatedLast7Days}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {t("dashboard.cards.deliveryTrend.tiles.completed")}
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.tasksCompletedLast7Days}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {t("dashboard.cards.deliveryTrend.tiles.reportsFiled")}
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.reportsSubmittedLast7Days}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-secondary/35 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {t("dashboard.cards.deliveryTrend.tiles.chatActivity")}
          </p>
          <p className="mt-2 text-xl font-semibold">
            {momentum.projectMessagesLast7Days}
          </p>
        </article>
      </div>
    </section>
  );
}
