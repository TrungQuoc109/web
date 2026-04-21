import { cn } from "@/shared/lib/cn";
import { getCurrentLanguage } from "@/i18n/languageStore";
import { Badge } from "@/shared/ui/badge";
import type { MemberRole } from "@/shared/types/workspace";

type RoleBadgeProps = {
  role: MemberRole;
  className?: string;
};

const roleStyles: Record<MemberRole, string> = {
  OWNER: "bg-primary text-primary-foreground",
  ADMIN: "bg-secondary text-secondary-foreground",
  MEMBER: "border-border bg-background text-foreground",
  VIEWER: "border-border bg-background text-muted-foreground",
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const language = getCurrentLanguage();
  const labels =
    language === "vi"
      ? {
          OWNER: "Chủ dự án",
          ADMIN: "Quản trị",
          MEMBER: "Thành viên",
          VIEWER: "Người xem",
        }
      : {
          OWNER: "Owner",
          ADMIN: "Admin",
          MEMBER: "Member",
          VIEWER: "Viewer",
        };

  return (
    <Badge className={cn("px-3 py-1", roleStyles[role], className)}>
      {labels[role]}
    </Badge>
  );
}
