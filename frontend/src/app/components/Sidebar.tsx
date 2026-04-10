import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";

import { navigationItems } from "@/app/config/navigation";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-foreground/20 backdrop-blur-[1px] transition-opacity md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-10 flex w-72 flex-col border-r border-border bg-background/95 px-4 py-5 backdrop-blur transition-transform duration-200 md:translate-x-0",
          collapsed && "md:w-24",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <div className={cn("min-w-0", collapsed && "md:hidden")}>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Workspace
            </p>
            <h1 className="truncate text-lg font-semibold">Project Hub</h1>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        <div className="mt-8 flex flex-1 flex-col gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                    isActive && "bg-secondary text-foreground",
                    collapsed && "md:justify-center md:px-0"
                  )
                }
              >
                <Icon aria-hidden="true" />
                <span className={cn("truncate", collapsed && "md:hidden")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>

        <div
          className={cn(
            "rounded-2xl border border-border bg-secondary/60 p-4",
            collapsed && "md:hidden"
          )}
        >
          <p className="text-sm font-medium">Team workspace</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Focused shell for projects, tasks, messages, and updates.
          </p>
        </div>
      </aside>
    </>
  );
}

