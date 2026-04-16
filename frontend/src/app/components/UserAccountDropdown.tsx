import { startTransition, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  LogOut,
  ShieldCheck,
  Settings2,
  User2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useLogout } from "@/auth/hooks/useLogout";
import { useAuthStore } from "@/auth/store/authStore";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

const accountLinks = [
  {
    to: "/settings#profile",
    label: "Profile",
    description: "Review your account details and role.",
    icon: User2,
  },
  {
    to: "/settings",
    label: "Settings",
    description: "Open workspace and product settings.",
    icon: Settings2,
  },
  {
    to: "/settings#security",
    label: "Security",
    description: "Session details and password support.",
    icon: ShieldCheck,
  },
] as const;

export function UserAccountDropdown() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    panelRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSignOut() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setOpen(false);

    startTransition(() => {
      logout();
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-account-panel"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-full border border-border bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar
          className="size-9"
          name={currentUser?.name}
          email={currentUser?.email}
        />

        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-sm font-medium">
            {currentUser?.name || "Project user"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser?.email || "user@example.com"}
          </p>
        </div>

        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        id="user-account-panel"
        ref={panelRef}
        role="menu"
        aria-label="Account menu"
        aria-hidden={!open}
        tabIndex={-1}
        className={`absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-[1.5rem] border border-border bg-background/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start gap-4">
            <Avatar
              className="size-12 shrink-0"
              name={currentUser?.name}
              email={currentUser?.email}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {currentUser?.name || "Project user"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {currentUser?.email || "user@example.com"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {currentUser?.role ?? "MEMBER"}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  Session active
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="flex flex-col gap-1">
            {accountLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-3 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-border bg-secondary/60 p-2">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-3 rounded-2xl px-3 py-6 text-left"
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
