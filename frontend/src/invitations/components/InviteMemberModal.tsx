import { useState, type FormEvent } from "react";
import { Link2, X } from "lucide-react";

import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/shared/ui/button";
import type { MemberRole } from "@/shared/types/workspace";

type InviteMemberModalProps = {
  open: boolean;
  projectName?: string | null;
  isPending?: boolean;
  onClose: () => void;
  onInvite: (input: {
    email: string;
    role: Exclude<MemberRole, "OWNER">;
  }) => Promise<unknown>;
};

export function InviteMemberModal({
  open,
  projectName,
  isPending = false,
  onClose,
  onInvite,
}: InviteMemberModalProps) {
  const { language } = useI18n();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<MemberRole, "OWNER">>("MEMBER");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const ui =
    language === "vi"
      ? {
          section: "Lời mời dự án",
          title: "Mời qua email",
          subtitle: `Tạo link tham gia cho ${projectName ?? "dự án đang chọn"} để đồng đội có thể chấp nhận quyền truy cập sau khi đăng nhập.`,
          close: "Đóng hộp thoại",
          email: "Email",
          emailPlaceholder: "thanhvien.moi@example.com",
          role: "Vai trò dự án",
          helper:
            "Backend sẽ tạo lời mời có token. Bạn có thể sao chép và chia sẻ link được tạo từ danh sách lời mời ngay sau bước này. Vai trò đã chọn sẽ được áp dụng khi lời mời được chấp nhận.",
          emptyEmail: "Hãy nhập email trước khi tạo lời mời.",
          createFailed: "Không thể tạo lời mời. Vui lòng thử lại.",
          cancel: "Hủy",
          creating: "Đang tạo...",
          create: "Tạo lời mời",
          roles: {
            ADMIN: "Quản trị",
            MEMBER: "Thành viên",
            VIEWER: "Người xem",
          } as Record<Exclude<MemberRole, "OWNER">, string>,
        }
      : {
          section: "Project invitation",
          title: "Invite by email",
          subtitle: `Generate a join link for ${projectName ?? "the selected project"} so a teammate can accept access after signing in.`,
          close: "Close modal",
          email: "Email",
          emailPlaceholder: "new.teammate@example.com",
          role: "Project role",
          helper:
            "The backend will create a tokenized invitation. You can copy and share the generated link from the invitation list right after this step. The selected project role will be applied when the invite is accepted.",
          emptyEmail: "Enter an email address before creating an invitation.",
          createFailed: "The invitation could not be created. Please try again.",
          cancel: "Cancel",
          creating: "Creating...",
          create: "Create invitation",
          roles: {
            ADMIN: "Admin",
            MEMBER: "Member",
            VIEWER: "Viewer",
          } as Record<Exclude<MemberRole, "OWNER">, string>,
        };

  if (!open) return null;

  function resetAndClose() {
    if (isPending) return;
    setEmail("");
    setRole("MEMBER");
    setSubmitError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setSubmitError(ui.emptyEmail);
      return;
    }

    setSubmitError(null);

    try {
      await onInvite({ email: normalizedEmail, role });
      setEmail("");
      setRole("MEMBER");
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : ui.createFailed
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-title"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-background p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {ui.section}
            </p>
            <h3 id="invite-member-title" className="mt-2 text-2xl font-semibold tracking-tight">
              {ui.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {ui.subtitle}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={resetAndClose}
            aria-label={ui.close}
            disabled={isPending}
          >
            <X />
          </Button>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1fr_0.42fr]">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">{ui.email}</span>
              <input
                type="email"
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={email}
                onChange={(event) => {
                  setSubmitError(null);
                  setEmail(event.target.value);
                }}
                placeholder={ui.emailPlaceholder}
                disabled={isPending}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">{ui.role}</span>
              <select
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as Exclude<MemberRole, "OWNER">)
                }
                disabled={isPending}
              >
                <option value="ADMIN">{ui.roles?.ADMIN ?? "Admin"}</option>
                <option value="MEMBER">{ui.roles?.MEMBER ?? "Member"}</option>
                <option value="VIEWER">{ui.roles?.VIEWER ?? "Viewer"}</option>
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 size-4 shrink-0" />
              <p>
                {ui.helper}
              </p>
            </div>
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isPending}>
              {ui.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? ui.creating : ui.create}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
