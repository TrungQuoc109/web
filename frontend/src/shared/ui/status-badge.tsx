import { useI18n } from "@/i18n/useI18n";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import type {
  NotificationType,
  ProjectStatus,
  TaskStatus,
} from "@/shared/types/workspace";

type StatusBadgeValue = TaskStatus | ProjectStatus | NotificationType;

type StatusBadgeProps = {
  value: StatusBadgeValue;
  className?: string;
};

const statusStyles: Record<StatusBadgeValue, string> = {
  TODO: "bg-secondary text-secondary-foreground",
  IN_PROGRESS: "bg-sky-100 text-sky-900",
  IN_REVIEW: "bg-amber-100 text-amber-900",
  DONE: "bg-emerald-100 text-emerald-900",
  BLOCKED: "border-destructive/30 bg-destructive/10 text-destructive",
  ACTIVE: "bg-secondary text-secondary-foreground",
  PLANNING: "bg-secondary text-secondary-foreground",
  AT_RISK: "border-destructive/30 bg-destructive/10 text-destructive",
  COMPLETED: "bg-primary text-primary-foreground",
  MENTION: "bg-secondary text-secondary-foreground",
  ASSIGNED: "bg-primary text-primary-foreground",
  STATUS_CHANGED: "border-border bg-background text-foreground",
  ANNOUNCEMENT: "bg-violet-100 text-violet-900",
};

export function StatusBadge({ value, className }: StatusBadgeProps) {
  // Must subscribe to language changes so badges re-render on locale switches.
  const { t } = useI18n();
  const key = `enums.statusBadge.${value}`;
  const label = t(key);

  return (
    <Badge className={cn("px-3 py-1", statusStyles[value], className)}>
      {label === key ? value : label}
    </Badge>
  );
}

