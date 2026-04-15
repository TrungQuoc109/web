import { Clock3 } from "lucide-react";

import type { DashboardActivity } from "@/dashboard/types/dashboard";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";

type ActivityListProps = {
  items: DashboardActivity[];
};

export function ActivityList({ items }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Clock3 />}
        title="No recent activity yet"
        description="Once your team starts creating projects and tasks, recent updates will appear here."
      />
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-background/95 shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <h3 className="text-lg font-semibold">Recent activity</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest workspace actions and team movement.
        </p>
      </div>

      <div className="flex flex-col gap-0">
        {items.map((item, index) => (
          <article
            key={item.id}
            className="flex gap-4 px-6 py-5"
          >
            <div className="mt-0.5 rounded-2xl border border-border bg-secondary/70 p-3">
              <Clock3 />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {formatRelativeDate(item.timestamp)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>

            {index < items.length - 1 ? null : null}
          </article>
        ))}
      </div>
    </div>
  );
}
