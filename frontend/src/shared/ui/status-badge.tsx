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

function formatStatusLabel(value: StatusBadgeValue) {
  return value.replaceAll("_", " ");
}

export function StatusBadge({ value, className }: StatusBadgeProps) {
  return (
    <Badge className={cn("px-3 py-1", statusStyles[value], className)}>
      {formatStatusLabel(value)}
    </Badge>
  );
}
