import { cn } from "@/shared/lib/cn";
import { getCurrentLanguage } from "@/i18n/languageStore";
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
  const language = getCurrentLanguage();
  const labels =
    language === "vi"
      ? {
          TODO: "Cần làm",
          IN_PROGRESS: "Đang làm",
          IN_REVIEW: "Đang duyệt",
          DONE: "Hoàn tất",
          BLOCKED: "Bị chặn",
          ACTIVE: "Đang hoạt động",
          PLANNING: "Đang lên kế hoạch",
          AT_RISK: "Rủi ro",
          COMPLETED: "Đã hoàn thành",
          MENTION: "Nhắc tên",
          ASSIGNED: "Được giao",
          STATUS_CHANGED: "Đổi trạng thái",
          ANNOUNCEMENT: "Thông báo",
        }
      : {
          TODO: "To do",
          IN_PROGRESS: "In progress",
          IN_REVIEW: "In review",
          DONE: "Done",
          BLOCKED: "Blocked",
          ACTIVE: "Active",
          PLANNING: "Planning",
          AT_RISK: "At risk",
          COMPLETED: "Completed",
          MENTION: "Mention",
          ASSIGNED: "Assigned",
          STATUS_CHANGED: "Status changed",
          ANNOUNCEMENT: "Announcement",
        };

  return labels[value];
}

export function StatusBadge({ value, className }: StatusBadgeProps) {
  return (
    <Badge className={cn("px-3 py-1", statusStyles[value], className)}>
      {formatStatusLabel(value)}
    </Badge>
  );
}
