import { useI18n } from "@/i18n/useI18n";
import { cn } from "@/shared/lib/cn";
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
  const { t } = useI18n();
  const key = `enums.memberRole.${role}`;
  const label = t(key);

  return (
    <Badge className={cn("px-3 py-1", roleStyles[role], className)}>
      {label === key ? role : label}
    </Badge>
  );
}

