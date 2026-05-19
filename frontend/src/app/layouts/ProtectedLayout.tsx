import { AppShell } from "@/app/components/AppShell";
import { ProtectedRoute } from "@/auth/components/ProtectedRoute";

export function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}
