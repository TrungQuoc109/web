import { cn } from "@/shared/lib/cn";
import { getCurrentLanguage } from "@/i18n/languageStore";
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
  const language = getCurrentLanguage();
  const labels =
    language === "vi"
      ? {
          LOW: "Thấp",
          MEDIUM: "Trung bình",
          HIGH: "Cao",
          URGENT: "Khẩn cấp",
        }
      : {
          LOW: "Low",
          MEDIUM: "Medium",
          HIGH: "High",
          URGENT: "Urgent",
        };

  return (
    <Badge className={cn("px-3 py-1", priorityStyles[priority], className)}>
      {labels[priority]}
    </Badge>
  );
}
