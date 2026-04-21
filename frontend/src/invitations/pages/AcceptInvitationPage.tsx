import { useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2, Link2, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAcceptInvitationMutation } from "@/invitations/hooks/useAcceptInvitationMutation";
import { useI18n } from "@/i18n/useI18n";
import { useAuthStore } from "@/auth/store/authStore";
import { normalizeApiError } from "@/shared/api/normalizeApiError";
import { Button } from "@/shared/ui/button";

export function AcceptInvitationPage() {
  const { t } = useI18n();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const acceptInvitation = useAcceptInvitationMutation();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated || !token) {
      return;
    }

    if (!accessToken || !currentUser) {
      navigate("/login", {
        replace: true,
        state: {
          from: { pathname: location.pathname },
          error: t("invite.signInRequired"),
        },
      });
      return;
    }

    if (attemptedRef.current) {
      return;
    }

    attemptedRef.current = true;
    void acceptInvitation.mutateAsync(token);
  }, [
    accessToken,
    acceptInvitation,
    currentUser,
    hasHydrated,
    location.pathname,
    navigate,
    token,
  ]);

  if (!hasHydrated || !token || (accessToken && !currentUser)) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-border bg-background/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin" />
            <p className="text-sm text-muted-foreground">{t("invite.preparing")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (acceptInvitation.isPending) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-border bg-background/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-border bg-secondary/60 p-3">
              <Link2 className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{t("invite.joiningTitle")}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("invite.joiningDescription")}
              </p>
              <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("invite.processing")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (acceptInvitation.isSuccess) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-border bg-background/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{t("invite.acceptedTitle")}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("invite.acceptedDescription")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" className="gap-2" onClick={() => navigate("/projects")}>
                {t("invite.openProjects")}
                <ArrowRight className="size-4" />
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                {t("invite.goDashboard")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const normalizedError = normalizeApiError(acceptInvitation.error);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border bg-background/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{t("invite.unavailableTitle")}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {normalizedError.message}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/projects")}>
              {t("invite.openProjects")}
            </Button>
            <Link to="/login" state={{ from: { pathname: location.pathname } }}>
              <Button type="button">{t("invite.signInAnother")}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
