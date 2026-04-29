import {
  Bell,
  Check,
  Languages,
  LogOut,
  MessageSquare,
  ShieldCheck,
  User2,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useChangePasswordMutation } from "@/auth/hooks/useChangePasswordMutation";
import { useUpdateProfileMutation } from "@/auth/hooks/useUpdateProfileMutation";
import { useLogout } from "@/auth/hooks/useLogout";
import { useAuthStore } from "@/auth/store/authStore";
import { useI18n } from "@/i18n/useI18n";
import { formatCalendarDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export function SettingsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useLogout();
  const updateProfile = useUpdateProfileMutation();
  const changePassword = useChangePasswordMutation();
  const { language, setLanguage, t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const connectedModules = [
    {
      id: "projects",
      icon: Workflow,
      href: "/projects",
      title: t("settings.connectedModulesList.projects.title"),
      description: t("settings.connectedModulesList.projects.description"),
      cta: t("settings.connectedModulesList.projects.cta"),
    },
    {
      id: "tasks",
      icon: Workflow,
      href: "/tasks",
      title: t("settings.connectedModulesList.tasks.title"),
      description: t("settings.connectedModulesList.tasks.description"),
      cta: t("settings.connectedModulesList.tasks.cta"),
    },
    {
      id: "messages",
      icon: MessageSquare,
      href: "/messages",
      title: t("settings.connectedModulesList.messages.title"),
      description: t("settings.connectedModulesList.messages.description"),
      cta: t("settings.connectedModulesList.messages.cta"),
    },
    {
      id: "members",
      icon: Users,
      href: "/members",
      title: t("settings.connectedModulesList.members.title"),
      description: t("settings.connectedModulesList.members.description"),
      cta: t("settings.connectedModulesList.members.cta"),
    },
    {
      id: "notifications",
      icon: Bell,
      href: "/notifications",
      title: t("settings.connectedModulesList.notifications.title"),
      description: t("settings.connectedModulesList.notifications.description"),
      cta: t("settings.connectedModulesList.notifications.cta"),
    },
  ];

  useEffect(() => {
    setName(currentUser?.name ?? "");
    setEmail(currentUser?.email ?? "");
    setProfileError(null);
  }, [currentUser?.email, currentUser?.name]);

  async function handleSaveProfile() {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setProfileError(t("settings.validationEmailRequired"));
      return;
    }

    if (trimmedName.length > 0 && trimmedName.length < 2) {
      setProfileError(t("settings.validationNameShort"));
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
      setPasswordError(t("settings.validationCurrentPasswordRequired"));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t("settings.validationNewPasswordShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.validationPasswordMismatch"));
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(t("settings.validationPasswordSame"));
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
            {t("settings.workspace")}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">{t("settings.title")}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>

        <Button type="button" variant="outline" className="gap-2" onClick={() => logout()}>
          <LogOut />
          {t("settings.signOut")}
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("settings.currentRole")}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {currentUser?.role ?? "MEMBER"}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("settings.currentRoleHelp")}
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("settings.profileStatus")}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {t("settings.profileReady")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("settings.profileStatusHelp")}
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("settings.connectedModules")}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {connectedModules.length}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t("settings.connectedModulesCountLabel")}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("settings.connectedModulesHelp")}
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
                {t("settings.profile")}
              </p>
              <h3 className="mt-3 text-xl font-semibold">{t("settings.accountOverview")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("settings.profileOverviewHelp")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/70 p-3">
              <User2 />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {t("settings.name")}
              </p>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={name}
                onChange={(event) => {
                  setProfileError(null);
                  setName(event.target.value);
                }}
                placeholder={t("settings.displayNamePlaceholder")}
                disabled={updateProfile.isPending}
              />
            </div>
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {t("settings.email")}
              </p>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                type="email"
                value={email}
                onChange={(event) => {
                  setProfileError(null);
                  setEmail(event.target.value);
                }}
                placeholder={t("settings.emailPlaceholder")}
                disabled={updateProfile.isPending}
              />
            </div>
            <div className="rounded-2xl border border-border bg-secondary/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {t("settings.created")}
              </p>
              <p className="mt-2 font-medium">
                {currentUser?.createdAt
                  ? formatCalendarDate(currentUser.createdAt)
                  : t("settings.unavailable")}
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
              {updateProfile.isPending
                ? t("settings.savingProfile")
                : t("settings.saveProfile")}
            </Button>
          </div>
        </article>

        <article className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {t("settings.workspaceStatus")}
              </p>
              <h3 className="mt-3 text-xl font-semibold">{t("settings.featureCoverage")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("settings.featureCoverageHelp")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/70 p-3">
              <ShieldCheck />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {connectedModules.map((module) => {
              const Icon = module.icon;

              return (
                <div
                  key={module.id}
                  className="rounded-2xl border border-border bg-secondary/35 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-border bg-background p-2">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{module.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{t("settings.live")}</Badge>
                  </div>

                  <Link
                    to={module.href}
                    className="mt-4 inline-flex text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {module.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              to="/projects"
              className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {t("settings.openProjects")}
            </Link>
            <Link
              to="/notifications"
              className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {t("settings.openNotifications")}
            </Link>
          </div>
        </article>
      </section>

      <section
        id="language"
        className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm scroll-mt-28"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t("settings.languageSection")}
            </p>
            <h3 className="mt-3 text-xl font-semibold">{t("settings.languageTitle")}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t("settings.languageHelp")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/70 p-3">
            <Languages />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-border bg-secondary/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{t("settings.languageEnglishTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.languageEnglishDescription")}
                </p>
              </div>
              {language === "en" ? (
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <Check className="size-3.5" />
                  {t("settings.selected")}
                </Badge>
              ) : null}
            </div>

            <div className="mt-5">
              <Button
                type="button"
                variant={language === "en" ? "secondary" : "outline"}
                onClick={() => setLanguage("en")}
              >
                {t("settings.selectLanguage")}
              </Button>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-secondary/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{t("settings.languageVietnameseTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.languageVietnameseDescription")}
                </p>
              </div>
              {language === "vi" ? (
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <Check className="size-3.5" />
                  {t("settings.selected")}
                </Badge>
              ) : null}
            </div>

            <div className="mt-5">
              <Button
                type="button"
                variant={language === "vi" ? "secondary" : "outline"}
                onClick={() => setLanguage("vi")}
              >
                {t("settings.selectLanguage")}
              </Button>
            </div>
          </article>
        </div>
      </section>

      <section
        id="security"
        className="rounded-[2rem] border border-border bg-background/95 p-6 shadow-sm scroll-mt-28"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t("settings.security")}
            </p>
            <h3 className="mt-3 text-xl font-semibold">{t("settings.sessionAccess")}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("settings.securityHelp")}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/70 p-3">
            <ShieldCheck />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-secondary/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.sessionStatus")}
            </p>
            <p className="mt-2 font-medium">{t("settings.authenticated")}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("settings.sessionStatusHelp")}
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-secondary/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.passwordManagement")}
            </p>
            <p className="mt-2 font-medium">{t("settings.availableNow")}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("settings.passwordManagementHelp")}
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-secondary/35 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.signOutCard")}
            </p>
            <p className="mt-2 font-medium">{t("settings.availableNow")}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("settings.signOutCardHelp")}
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[1.75rem] border border-border bg-secondary/20 p-5">
            <div>
              <p className="text-sm font-semibold">{t("settings.changePassword")}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("settings.changePasswordHelp")}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {t("settings.currentPassword")}
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
                    {t("settings.newPassword")}
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
                    {t("settings.confirmNewPassword")}
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
                {changePassword.isPending
                  ? t("settings.updatingPassword")
                  : t("settings.updatePassword")}
              </Button>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-border bg-secondary/20 p-5">
            <p className="text-sm font-semibold">{t("settings.securityGuidance")}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>{t("settings.securityTip1")}</p>
              <p>{t("settings.securityTip2")}</p>
              <p>{t("settings.securityTip3")}</p>
            </div>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="gap-2" onClick={() => logout()}>
            <LogOut />
            {t("settings.signOut")}
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {t("settings.passwordUpdateLive")}
          </Badge>
        </div>
      </section>
    </section>
  );
}
