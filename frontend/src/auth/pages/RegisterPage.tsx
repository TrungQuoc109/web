import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useRegisterMutation } from "@/auth/hooks/useRegisterMutation";
import { getApiErrorMessage } from "@/shared/api/getApiErrorMessage";
import { Button } from "@/shared/ui/button";

const schema = z.object({
  name: z
    .string()
    .trim()
    .refine((v) => v === "" || v.length >= 2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    await registerMutation.mutateAsync({
      ...values,
      name: values.name?.trim() ? values.name.trim() : undefined,
    });
    navigate("/", { replace: true });
  }

  const rootError = registerMutation.isError
    ? getApiErrorMessage(registerMutation.error)
    : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-border bg-background/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">
            Register to start managing projects.
          </p>
        </div>

        {rootError ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {rootError}
          </div>
        ) : null}

        <form className="mt-6 flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Name (optional)</span>
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
            <span className="text-sm font-medium">Email</span>
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
            <span className="text-sm font-medium">Password</span>
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
            {registerMutation.isPending ? "Creating..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="text-foreground underline" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
