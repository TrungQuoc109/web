import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useLoginMutation } from "@/auth/hooks/useLoginMutation";
import { useI18n } from "@/i18n/useI18n";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { Button } from "@/shared/ui/button";

type FormValues = {
  email: string;
  password: string;
};

type LocationState = {
  from?: { pathname?: string };
  error?: string;
  email?: string;
  success?: string;
};

export function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const schema = z.object({
    email: z.string().email(t("auth.validation.email")),
    password: z
      .string()
      .min(8, t("auth.validation.passwordLength")),
  });

  const login = useLoginMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: state.email ?? "",
      password: "",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    try {
      await login.mutateAsync(values);
      navigate(state.from?.pathname || "/", { replace: true });
    } catch {
      // Error UI is handled via React Query state + toast.
    }
  }

  const rootError =
    state.error || (login.isError ? getApiErrorMessage(login.error) : null);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border bg-background/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t("auth.login.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </div>

        {rootError ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {rootError}
          </div>
        ) : null}

        {state.success ? (
          <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {state.success}
          </div>
        ) : null}

        <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("auth.common.email")}</span>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              autoComplete="email"
              inputMode="email"
              {...form.register("email")}
            />
            {form.formState.errors.email?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("auth.common.password")}</span>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {form.formState.errors.password?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </label>

          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? t("auth.login.signingIn") : t("auth.login.submit")}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {t("auth.login.noAccount")}{" "}
          <Link
            className="text-foreground underline"
            to="/register"
            state={{ from: state.from }}
          >
            {t("auth.login.createOne")}
          </Link>
        </p>
      </div>
    </div>
  );
}
