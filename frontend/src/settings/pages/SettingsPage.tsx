import {
  AlertTriangle,
  Bell,
  Check,
  FolderKanban,
  KeyRound,
  Languages,
  LogOut,
  MessageSquare,
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
  const [activeTab, setActiveTab] = useState("profile");
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
  const settingsTabs = [
    { id: "profile", label: t("settings.profile"), icon: User2 },
    { id: "account", label: t("settings.languageSection"), icon: Languages },
    { id: "notifications", label: t("nav.notifications"), icon: Bell },
    { id: "project", label: t("nav.projects"), icon: FolderKanban },
    { id: "members", label: t("nav.members"), icon: Users },
    { id: "security", label: t("settings.security"), icon: KeyRound },
    {
      id: "danger",
      label: language === "vi" ? "Khu vực nguy hiểm" : "Danger Zone",
      icon: AlertTriangle,
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
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t("settings.workspace")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {t("settings.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{currentUser?.role ?? "MEMBER"}</Badge>
          <Badge variant="secondary">{t("settings.profileReady")}</Badge>
          <Button type="button" variant="outline" className="gap-2" onClick={() => logout()}>
            <LogOut className="size-4" />
            {t("settings.signOut")}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-background p-2 shadow-sm xl:flex-col xl:overflow-visible">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`inline-flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <section className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          {activeTab === "profile" ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold">{t("settings.accountOverview")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.profileOverviewHelp")}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">{t("settings.name")}</span>
                  <input
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={name}
                    onChange={(event) => {
                      setProfileError(null);
                      setName(event.target.value);
                    }}
                    placeholder={t("settings.displayNamePlaceholder")}
                    disabled={updateProfile.isPending}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">{t("settings.email")}</span>
                  <input
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setProfileError(null);
                      setEmail(event.target.value);
                    }}
                    placeholder={t("settings.emailPlaceholder")}
                    disabled={updateProfile.isPending}
                  />
                </label>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{t("settings.created")}: </span>
                <span className="font-medium">
                  {currentUser?.createdAt
                    ? formatCalendarDate(currentUser.createdAt)
                    : t("settings.unavailable")}
                </span>
              </div>

              {profileError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {profileError}
                </div>
              ) : null}

              <div className="flex justify-end">
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
            </div>
          ) : null}

          {activeTab === "account" ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold">{t("settings.languageTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.languageHelp")}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(["en", "vi"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      language === option
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/15 hover:bg-accent"
                    }`}
                    onClick={() => setLanguage(option)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">
                        {option === "en"
                          ? t("settings.languageEnglishTitle")
                          : t("settings.languageVietnameseTitle")}
                      </span>
                      {language === option ? <Check className="size-4" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option === "en"
                        ? t("settings.languageEnglishDescription")
                        : t("settings.languageVietnameseDescription")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {["notifications", "project", "members"].includes(activeTab) ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold">{t("settings.featureCoverage")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.featureCoverageHelp")}
                </p>
              </div>
              <div className="grid gap-3">
                {connectedModules
                  .filter((module) => {
                    if (activeTab === "notifications") return module.id === "notifications";
                    if (activeTab === "project") return ["projects", "tasks"].includes(module.id);
                    return module.id === "members";
                  })
                  .map((module) => {
                    const Icon = module.icon;
                    return (
                      <article
                        key={module.id}
                        className="rounded-xl border border-border bg-secondary/15 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 size-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{module.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {module.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{t("settings.live")}</Badge>
                        </div>
                        <Link
                          to={module.href}
                          className="mt-3 inline-flex text-sm font-medium hover:text-primary"
                        >
                          {module.cta}
                        </Link>
                      </article>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {activeTab === "security" ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold">{t("settings.changePassword")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.changePasswordHelp")}
                </p>
              </div>
              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">{t("settings.currentPassword")}</span>
                  <input
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setPasswordError(null);
                      setCurrentPassword(event.target.value);
                    }}
                    autoComplete="current-password"
                    disabled={changePassword.isPending}
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium">{t("settings.newPassword")}</span>
                    <input
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setPasswordError(null);
                        setNewPassword(event.target.value);
                      }}
                      autoComplete="new-password"
                      disabled={changePassword.isPending}
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-sm font-medium">
                      {t("settings.confirmNewPassword")}
                    </span>
                    <input
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setPasswordError(null);
                        setConfirmPassword(event.target.value);
                      }}
                      autoComplete="new-password"
                      disabled={changePassword.isPending}
                    />
                  </label>
                </div>
              </div>

              {passwordError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {passwordError}
                </div>
              ) : null}

              <div className="flex justify-end">
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
            </div>
          ) : null}

          {activeTab === "danger" ? (
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold text-destructive">
                  {language === "vi" ? "Khu vực nguy hiểm" : "Danger Zone"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("settings.signOutCardHelp")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-fit gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => logout()}
              >
                <LogOut className="size-4" />
                {t("settings.signOut")}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
