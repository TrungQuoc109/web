import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useI18n } from "@/i18n/useI18n";
import { useRegisterMutation } from "@/auth/hooks/useRegisterMutation";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { Button } from "@/shared/ui/button";

type FormValues = {
  name: string;
  email: string;
  password: string;
};

export function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as { from?: { pathname?: string } };
  const schema = z.object({
    name: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || v.length >= 2,
        t("auth.validation.nameLength")
      ),
    email: z.string().email(t("auth.validation.email")),
    password: z
      .string()
      .min(8, t("auth.validation.passwordLength")),
  });

  const registerMutation = useRegisterMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    try {
      await registerMutation.mutateAsync({
        ...values,
        name: values.name?.trim() ? values.name.trim() : undefined,
      });
      navigate("/login", {
        replace: true,
        state: {
          email: values.email,
          success: t("auth.register.success"),
          from: state.from,
        },
      });
    } catch {
      // Error UI is handled via React Query state + toast.
    }
  }

  const rootError = registerMutation.isError
    ? getApiErrorMessage(registerMutation.error)
    : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border bg-background/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t("auth.register.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.register.subtitle")}
          </p>
        </div>

        {rootError ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {rootError}
          </div>
        ) : null}

        <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t("auth.register.nameOptional")}</span>
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              autoComplete="name"
              {...form.register("name")}
            />
            {form.formState.errors.name?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </label>

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
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </label>

          <Button
            className="w-full"
            type="submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending
              ? t("auth.register.creating")
              : t("auth.register.submit")}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {t("auth.register.hasAccount")}{" "}
          <Link
            className="text-foreground underline"
            to="/login"
            state={{ from: state.from }}
          >
            {t("auth.register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
