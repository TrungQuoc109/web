import { AppShell } from "@/app/components/AppShell";
import { RequireAuth } from "@/auth/components/RequireAuth";

export function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  );
}

