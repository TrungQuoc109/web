import { Bell, LogOut, ShieldCheck, User2, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useChangePasswordMutation } from "@/auth/hooks/useChangePasswordMutation";
import { useUpdateProfileMutation } from "@/auth/hooks/useUpdateProfileMutation";
import { useLogout } from "@/auth/hooks/useLogout";
import { useAuthStore } from "@/auth/store/authStore";
import { formatCalendarDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export function SettingsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useLogout();
  const updateProfile = useUpdateProfileMutation();
  const changePassword = useChangePasswordMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentUser?.name ?? "");
    setEmail(currentUser?.email ?? "");
    setProfileError(null);
  }, [currentUser?.email, currentUser?.name]);

  async function handleSaveProfile() {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setProfileError("Email is required.");
      return;
    }

    if (trimmedName.length > 0 && trimmedName.length < 2) {
      setProfileError("Name must be at least 2 characters when provided.");
      return;
    }

    setProfileError(null);
    await updateProfile.mutateAsync({
      email: trimmedEmail,
      name: trimmedName || undefined,
    });
  }

  async function handleChangePassword() {
    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password confirmation does not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from the current password.");
      return;
    }

    setPasswordError(null);
    await changePassword.mutateAsync({
      currentPassword,
      newPassword,
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

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
        <article
          id="profile"
          className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm scroll-mt-28"
        >
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
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={name}
                  onChange={(event) => {
                    setProfileError(null);
                    setName(event.target.value);
                  }}
                  placeholder="Your display name"
                  disabled={updateProfile.isPending}
                />
              </div>
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Email
              </p>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                type="email"
                value={email}
                onChange={(event) => {
                  setProfileError(null);
                  setEmail(event.target.value);
                }}
                placeholder="you@example.com"
                disabled={updateProfile.isPending}
              />
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

          {profileError ? (
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {profileError}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving..." : "Save profile"}
            </Button>
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
              <Badge variant="secondary">Live</Badge>
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

      <section
        id="security"
        className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm scroll-mt-28"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Security
            </p>
            <h3 className="mt-3 text-xl font-semibold">Session and access</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review the current authenticated session and the security capabilities that are already wired in the app.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/70 p-3">
            <ShieldCheck />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-secondary/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Session status
            </p>
            <p className="mt-2 font-medium">Authenticated</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your JWT-backed session is currently loaded in the frontend auth store.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-secondary/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Password management
            </p>
            <p className="mt-2 font-medium">Available now</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Rotate your password without leaving the app by confirming your current credentials first.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-secondary/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Sign out
            </p>
            <p className="mt-2 font-medium">Available now</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              You can safely clear the current session from the account menu or with the button below.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[1.75rem] border border-border bg-secondary/20 p-5">
            <div>
              <p className="text-sm font-semibold">Change password</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use a strong password with at least 8 characters. Your current
                session stays active after the update.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Current password
                </p>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setPasswordError(null);
                    setCurrentPassword(event.target.value);
                  }}
                  autoComplete="current-password"
                  disabled={changePassword.isPending}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    New password
                  </p>
                  <input
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setPasswordError(null);
                      setNewPassword(event.target.value);
                    }}
                    autoComplete="new-password"
                    disabled={changePassword.isPending}
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Confirm new password
                  </p>
                  <input
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setPasswordError(null);
                      setConfirmPassword(event.target.value);
                    }}
                    autoComplete="new-password"
                    disabled={changePassword.isPending}
                  />
                </div>
              </div>
            </div>

            {passwordError ? (
              <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {passwordError}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                onClick={() => void handleChangePassword()}
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? "Updating..." : "Update password"}
              </Button>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-secondary/20 p-5">
            <p className="text-sm font-semibold">Security guidance</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                Use a password you do not reuse in other environments or demo accounts.
              </p>
              <p>
                After updating your password, future sign-ins will require the new value immediately.
              </p>
              <p>
                If you are testing shared seed accounts, make sure teammates know the credential has changed.
              </p>
            </div>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="gap-2" onClick={() => logout()}>
            <LogOut />
            Sign out
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            Password update live
          </Badge>
        </div>
      </section>
    </section>
  );
}
