import { useState } from "react";
import { Outlet } from "react-router-dom";

import { RealtimeBootstrap } from "@/realtime/components/RealtimeBootstrap";
import { Sidebar } from "@/app/components/Sidebar";
import { Topbar } from "@/app/components/Topbar";
import { cn } from "@/shared/lib/cn";

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.04),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,0.9),_rgba(255,255,255,1))] text-foreground">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />

      <div
        className={cn(
          "min-h-dvh transition-[padding] duration-200 md:pl-72",
          collapsed && "md:pl-24"
        )}
      >
        <RealtimeBootstrap />
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
