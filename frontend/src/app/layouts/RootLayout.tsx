import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { useAuthStore } from "@/auth/store/authStore";
import { useLogout } from "@/auth/hooks/useLogout";
import { cn } from "@/shared/lib/cn";

export function RootLayout() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useLogout();

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <nav className="flex items-center gap-2">
            <NavItem to="/">Dashboard</NavItem>
            <NavItem to="/projects">Projects</NavItem>
            <NavItem to="/tasks">Tasks</NavItem>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentUser?.email ?? "Loading..."}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-md px-3 py-2 text-sm hover:bg-accent",
          isActive && "bg-accent"
        )
      }
      end={to === "/"}
    >
      {children}
    </NavLink>
  );
}
