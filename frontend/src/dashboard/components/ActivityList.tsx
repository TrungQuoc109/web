import {
  BellRing,
  Clock3,
  FileCheck2,
  FolderKanban,
  ListTodo,
  MessageSquareText,
  UserRound,
} from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category?: "PROJECT" | "MEMBER" | "MESSAGE" | "TASK" | "REPORT" | "INVITATION";
  actorName?: string | null;
};

type ActivityListProps = {
  items: ActivityItem[];
};

const categoryUi: Record<
  NonNullable<ActivityItem["category"]>,
  { icon: typeof Clock3; tone: string }
> = {
  PROJECT: {
    icon: FolderKanban,
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  MEMBER: {
    icon: UserRound,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  MESSAGE: {
    icon: MessageSquareText,
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  },
  TASK: {
    icon: ListTodo,
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  REPORT: {
    icon: FileCheck2,
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  INVITATION: {
    icon: BellRing,
    tone: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

export function ActivityList({ items }: ActivityListProps) {
  const { t } = useI18n();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Clock3 />}
        title={t("activity.emptyTitle")}
        description={t("activity.emptyDescription")}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-background/95 shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <h3 className="text-lg font-semibold">{t("activity.title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("activity.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-0">
        {items.map((item) => {
          const activityCategory = item.category ?? "MESSAGE";
          const ui = categoryUi[activityCategory];
          const Icon = ui.icon;
          const badgeLabel = t(`activity.category.${activityCategory}`);

          return (
            <article key={item.id} className="flex gap-4 px-6 py-5">
              <div className="mt-0.5 rounded-2xl border border-border bg-secondary/70 p-3">
                <Icon className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                          ui.tone,
                        ].join(" ")}
                      >
                        {badgeLabel}
                      </span>
                      {item.actorName ? (
                        <span className="text-xs text-muted-foreground">
                          {item.actorName}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {formatRelativeDate(item.timestamp)}
                  </p>
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
