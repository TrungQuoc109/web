import { Bell, LogOut, Menu } from "lucide-react";

import { useLogout } from "@/auth/hooks/useLogout";
import { useAuthStore } from "@/auth/store/authStore";
import { useNotificationsUnreadCount } from "@/notifications/hooks/useNotificationsUnreadCount";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type TopbarProps = {
  onOpenSidebar: () => void;
};

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useLogout();
  const unreadCountQuery = useNotificationsUnreadCount();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenSidebar}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Project Management
            </p>
            <p className="text-sm font-medium text-foreground">
              Collaborative workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Button type="button" variant="outline" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <Badge className="absolute -right-1 -top-1 min-w-5 justify-center px-1.5 py-0">
              {unreadCountQuery.data ?? 0}
            </Badge>
          </div>

          <div className="hidden items-center gap-3 rounded-full border border-border bg-secondary/50 px-3 py-2 sm:flex">
            <Avatar
              className="size-9"
              name={currentUser?.name}
              email={currentUser?.email}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {currentUser?.name || "Project user"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentUser?.email || "user@example.com"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            aria-label="Logout"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
