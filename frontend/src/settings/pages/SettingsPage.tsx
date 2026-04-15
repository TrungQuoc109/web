import { Bell, LogOut, ShieldCheck, User2, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

import { useLogout } from "@/auth/hooks/useLogout";
import { useAuthStore } from "@/auth/store/authStore";
import { formatCalendarDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export function SettingsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useLogout();

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Review your current profile, session state, and the production features already connected in this portfolio workspace.
          </p>
        </div>

        <Button type="button" variant="outline" className="gap-2" onClick={() => logout()}>
          <LogOut />
          Sign out
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Current role</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {currentUser?.role ?? "MEMBER"}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Active authorization role returned by the authenticated backend session.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Profile status</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">Ready</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account is hydrated in the frontend auth store and available across protected routes.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Connected modules</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">4+</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Auth, projects, tasks, messages, and notification summary are already wired to real APIs.
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Profile
              </p>
              <h3 className="mt-3 text-xl font-semibold">Account overview</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Read-only identity details from the authenticated user profile.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/70 p-3">
              <User2 />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Name
              </p>
              <p className="mt-2 font-medium">
                {currentUser?.name || "Not set yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Email
              </p>
              <p className="mt-2 font-medium">
                {currentUser?.email || "No email available"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Created
              </p>
              <p className="mt-2 font-medium">
                {currentUser?.createdAt ? formatCalendarDate(currentUser.createdAt) : "Unavailable"}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Workspace status
              </p>
              <h3 className="mt-3 text-xl font-semibold">Feature coverage</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A quick status board for the parts of the app currently backed by real services.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/70 p-3">
              <ShieldCheck />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/35 px-4 py-3">
              <div className="flex items-center gap-3">
                <Workflow />
                <span className="text-sm font-medium">Tasks and project board</span>
              </div>
              <Badge variant="secondary">Live</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/35 px-4 py-3">
              <div className="flex items-center gap-3">
                <Bell />
                <span className="text-sm font-medium">Notification unread count</span>
              </div>
              <Badge variant="secondary">Live</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/35 px-4 py-3">
              <div className="flex items-center gap-3">
                <ShieldCheck />
                <span className="text-sm font-medium">Full notification inbox</span>
              </div>
              <Badge variant="outline">Blocked</Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              to="/projects"
              className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              Open projects
            </Link>
            <Link
              to="/notifications"
              className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              Open notifications
            </Link>
          </div>
        </article>
      </section>
    </section>
  );
}
