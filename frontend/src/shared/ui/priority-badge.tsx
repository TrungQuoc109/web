import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import type { TaskPriority } from "@/shared/types/workspace";

type PriorityBadgeProps = {
  priority: TaskPriority;
  className?: string;
};

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-secondary text-secondary-foreground",
  MEDIUM: "bg-secondary text-secondary-foreground",
  HIGH: "border-destructive/30 bg-destructive/10 text-destructive",
  URGENT: "bg-primary text-primary-foreground",
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge className={cn("px-3 py-1", priorityStyles[priority], className)}>
      {priority}
    </Badge>
  );
}

