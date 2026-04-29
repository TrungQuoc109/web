import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, Workflow } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import type { TaskStatus } from "@/shared/types/workspace";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";

type TaskDistributionCardProps = {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
};

const statusConfig: Array<{
  key: TaskStatus;
  icon: typeof Clock3;
  barClassName: string;
}> = [
  {
    key: "TODO",
    icon: CircleDashed,
    barClassName: "bg-slate-500/75",
  },
  {
    key: "IN_PROGRESS",
    icon: Workflow,
    barClassName: "bg-sky-500/80",
  },
  {
    key: "IN_REVIEW",
    icon: Clock3,
    barClassName: "bg-amber-500/80",
  },
  {
    key: "DONE",
    icon: CheckCircle2,
    barClassName: "bg-emerald-500/80",
  },
  {
    key: "BLOCKED",
    icon: AlertTriangle,
    barClassName: "bg-rose-500/80",
  },
];

export function TaskDistributionCard({
  totalTasks,
  tasksByStatus,
}: TaskDistributionCardProps) {
  const { t } = useI18n();

  return (
    <section className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{t("dashboard.cards.taskDistribution.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.cards.taskDistribution.subtitle")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {statusConfig.map((status) => {
          const value = tasksByStatus[status.key];
          const percentage = totalTasks === 0 ? 0 : Math.round((value / totalTasks) * 100);
          const Icon = status.icon;

          return (
            <article key={status.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-border bg-secondary/60 p-2 text-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {t(`dashboard.cards.taskDistribution.status.${status.key}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.cards.taskDistribution.workloadShare", {
                        percentage,
                      })}
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="px-3 py-1">
                  {value}
                </Badge>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-[width]", status.barClassName)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
