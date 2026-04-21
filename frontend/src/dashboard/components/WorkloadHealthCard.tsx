import { AlertTriangle, FolderGit2 } from "lucide-react";

import type { DashboardOverview } from "@/dashboard/types/dashboard";
import { Badge } from "@/shared/ui/badge";

type WorkloadHealthCardProps = {
  projectHealth: DashboardOverview["analytics"]["projectHealth"];
  tasksByPriority: DashboardOverview["analytics"]["tasksByPriority"];
};

const projectHealthConfig = [
  { key: "ACTIVE", label: "Active" },
  { key: "AT_RISK", label: "At risk" },
  { key: "PLANNING", label: "Planning" },
  { key: "COMPLETED", label: "Completed" },
] as const;

const priorityConfig = [
  { key: "URGENT", label: "Urgent", barClassName: "bg-rose-500/85" },
  { key: "HIGH", label: "High", barClassName: "bg-amber-500/85" },
  { key: "MEDIUM", label: "Medium", barClassName: "bg-sky-500/85" },
  { key: "LOW", label: "Low", barClassName: "bg-emerald-500/85" },
] as const;

export function WorkloadHealthCard({
  projectHealth,
  tasksByPriority,
}: WorkloadHealthCardProps) {
  const totalPriorityTasks = Object.values(tasksByPriority).reduce(
    (total, value) => total + value,
    0
  );

  return (
    <section className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-border bg-secondary/60 p-3">
          <FolderGit2 />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Project risk and workload</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Derived health by project plus current task pressure by priority.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {projectHealthConfig.map((item) => (
          <article
            key={item.key}
            className="rounded-2xl border border-border bg-secondary/35 p-4"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {projectHealth[item.key]}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-secondary/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Priority mix</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {totalPriorityTasks} tasks
          </Badge>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {priorityConfig.map((item) => {
            const value = tasksByPriority[item.key];
            const width =
              totalPriorityTasks === 0 ? 0 : Math.round((value / totalPriorityTasks) * 100);

            return (
              <article key={item.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {value} tasks
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className={`h-full rounded-full transition-[width] ${item.barClassName}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
