import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Copy, Link2, Plus, Search, Users, X } from "lucide-react";

import { useAuthStore } from "@/auth/store/authStore";
import { useI18n } from "@/i18n/useI18n";
import { InviteMemberModal } from "@/invitations/components/InviteMemberModal";
import { useCancelInvitationMutation } from "@/invitations/hooks/useCancelInvitationMutation";
import { useCreateInvitationMutation } from "@/invitations/hooks/useCreateInvitationMutation";
import { useProjectInvitations } from "@/invitations/hooks/useProjectInvitations";
import { useResendInvitationMutation } from "@/invitations/hooks/useResendInvitationMutation";
import type { ProjectInvitation } from "@/invitations/types/invitation";
import { AddMemberModal } from "@/members/components/AddMemberModal";
import { useAddMemberMutation } from "@/members/hooks/useAddMemberMutation";
import { useMembers } from "@/members/hooks/useMembers";
import { useRemoveMemberMutation } from "@/members/hooks/useRemoveMemberMutation";
import { useUpdateMemberRoleMutation } from "@/members/hooks/useUpdateMemberRoleMutation";
import { RoleBadge } from "@/members/components/RoleBadge";
import type { MemberRole } from "@/members/types/member";
import { useProjects } from "@/projects/hooks/useProjects";
import { getDisplayName } from "@/shared/lib/display";
import { formatCalendarDate } from "@/shared/lib/format-date";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import {
  FilterDropdownChip,
  type FilterDropdownOption,
} from "@/shared/ui/filter-dropdown-chip";
import { LoadingState } from "@/shared/ui/loading-state";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useToastStore } from "@/shared/lib/toast-store";

const roleOptions: MemberRole[] = ["ADMIN", "MEMBER", "VIEWER"];
const memberFilterOptions: Array<"ALL" | MemberRole> = [
  "ALL",
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
];
const invitationStatusOptions: Array<"ALL" | ProjectInvitation["status"]> = [
  "ALL",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "CANCELED",
];
const membersPerPage = 8;

export function MembersPage() {
  const { language } = useI18n();
  const projectsQuery = useProjects();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<"ALL" | MemberRole>("ALL");
  const [memberPage, setMemberPage] = useState(1);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteStatusFilter, setInviteStatusFilter] =
    useState<"ALL" | ProjectInvitation["status"]>("ALL");
  const [memberRemovalTarget, setMemberRemovalTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const deferredMemberSearch = useDeferredValue(memberSearch);
  const allMembersQuery = useMembers(selectedProjectId || undefined);
  const membersQuery = useMembers(selectedProjectId || undefined, {
    search: deferredMemberSearch.trim() || undefined,
    role: memberRoleFilter === "ALL" ? undefined : memberRoleFilter,
  });
  const invitationsQuery = useProjectInvitations(selectedProjectId || undefined);
  const addMember = useAddMemberMutation();
  const createInvitation = useCreateInvitationMutation();
  const resendInvitation = useResendInvitationMutation();
  const cancelInvitation = useCancelInvitationMutation();
  const removeMember = useRemoveMemberMutation();
  const updateMemberRole = useUpdateMemberRoleMutation();
  const ui =
    language === "vi"
      ? {
          workspace: "Không gian làm việc",
          title: "Thành viên",
          subtitle:
            "Quản lý ai đang ở trong dự án đã chọn, vai trò họ đang giữ và thời điểm họ tham gia.",
          addMember: "Thêm thành viên",
          inviteByEmail: "Mời qua email",
          members: "thành viên",
          loadingTitle: "Thành viên",
          loadingDescription:
            "Đang tải danh sách thành viên dự án và các cấp quyền truy cập.",
          unavailableTitle: "Không thể tải thành viên",
          unavailableDescription:
            "Không thể tải danh sách dự án từ backend. Hãy thử lại để khôi phục trang.",
          noProjectsTitle: "Chưa có dự án nào",
          noProjectsDescription:
            "Hãy tham gia hoặc tạo dự án trước khi quản lý thành viên. Backend hiện đang trả thành viên theo từng dự án.",
          totalMembers: "Tổng thành viên",
          totalMembersHelp: (name: string) =>
            `Tất cả mọi người hiện đang có trong ${name}.`,
          elevatedRoles: "Vai trò nâng cao",
          elevatedRolesHelp:
            "Owner và admin có quyền rộng hơn trong dự án này.",
          viewers: "Người xem",
          viewersHelp:
            "Các cộng tác viên chủ yếu có quyền xem trong dự án.",
          pendingInvites: "Lời mời chờ xử lý",
          pendingInvitesHelp:
            "Các link còn hiệu lực đang chờ đồng đội chấp nhận quyền truy cập.",
          searchMembers: "Tìm thành viên theo tên hoặc email",
          allRoles: "Tất cả vai trò",
          visible: "hiển thị",
          filter: "Bộ lọc",
          search: "Tìm kiếm",
          page: "Trang",
          of: "trên",
          noMembersTitle: "Chưa có thành viên",
          noMembersDescription:
            "Khi đồng đội được thêm vào dự án này, họ sẽ xuất hiện tại đây cùng vai trò và ngày tham gia.",
          noMembersMatchTitle: "Không có thành viên phù hợp bộ lọc",
          noMembersMatchDescription:
            "Hãy thử từ khóa khác hoặc đổi bộ lọc vai trò để hiển thị lại thành viên.",
          member: "Thành viên",
          email: "Email",
          role: "Vai trò",
          joined: "Ngày tham gia",
          actions: "Hành động",
          ownerRoleLocked:
            "Chuyển quyền sở hữu chưa hỗ trợ tại đây, nên vai trò owner được cố định.",
          selfRoleLocked:
            "Việc đổi vai trò của chính bạn sẽ được hỗ trợ qua flow riêng sau này.",
          roleSaved: "Thay đổi vai trò được lưu trực tiếp xuống backend.",
          cannotManageRoles:
            "Chỉ owner và admin mới có thể quản lý vai trò trong dự án này.",
          remove: "Gỡ",
          showing: "Hiển thị",
          previous: "Trước",
          next: "Sau",
          invitations: "Lời mời",
          invitationsHelp:
            "Theo dõi các link mời đang hoạt động và chia sẻ cho đồng đội chưa vào dự án.",
          searchInvitations: "Tìm lời mời theo email",
          allStatuses: "Tất cả trạng thái",
          loadingInvitations: "Đang tải lời mời...",
          invitationsUnavailableTitle: "Không thể tải lời mời",
          invitationsUnavailableDescription:
            "Không thể tải danh sách lời mời của dự án từ backend.",
          noInvitationsTitle: "Chưa có lời mời nào",
          noInvitationsDescription:
            "Hãy tạo link mời để đồng đội có thể tham gia dự án sau khi đăng nhập.",
          createInvitation: "Tạo lời mời",
          noInvitationsMatchTitle: "Không có lời mời phù hợp bộ lọc",
          noInvitationsMatchDescription:
            "Hãy điều chỉnh email hoặc trạng thái để xem các link mời phù hợp.",
          created: "Tạo lúc",
          expires: "Hết hạn",
          resend: "Gửi lại",
          copyLink: "Sao chép link",
          cancel: "Hủy",
          inviteLinkCopied: "Đã sao chép link mời",
          copyFailed: "Sao chép thất bại",
          copyFailedDescription:
            "Trình duyệt đã chặn quyền truy cập clipboard cho link lời mời.",
          removeMemberTitle: "Gỡ thành viên",
          removeMemberConfirm: "Gỡ thành viên",
          removeMemberDescription: (email: string, project: string) =>
            `Gỡ ${email} khỏi ${project}? Người này sẽ mất quyền truy cập cho tới khi được thêm lại.`,
          roleLabels: {
            OWNER: "Chủ dự án",
            ADMIN: "Quản trị",
            MEMBER: "Thành viên",
            VIEWER: "Người xem",
          } as Record<MemberRole | "OWNER", string>,
          invitationStatuses: {
            PENDING: "Chờ phản hồi",
            ACCEPTED: "Đã chấp nhận",
            REJECTED: "Đã từ chối",
            CANCELED: "Đã hủy",
          } as Record<ProjectInvitation["status"], string>,
        }
      : {
          workspace: "Workspace",
          title: "Members",
          subtitle:
            "Manage who is in the selected project, what role they hold, and when they joined.",
          addMember: "Add member",
          inviteByEmail: "Invite by email",
          members: "members",
          loadingTitle: "Members",
          loadingDescription:
            "Loading the project roster and access levels.",
          unavailableTitle: "Members unavailable",
          unavailableDescription:
            "The project list could not be loaded from the backend. Retry to restore the page.",
          noProjectsTitle: "No projects yet",
          noProjectsDescription:
            "Join or create a project before managing members. The backend currently exposes members by project.",
          totalMembers: "Total members",
          totalMembersHelp: (name: string) =>
            `Everyone currently included in ${name}.`,
          elevatedRoles: "Elevated roles",
          elevatedRolesHelp:
            "Owners and admins with broader access in this project.",
          viewers: "Viewers",
          viewersHelp:
            "Read-focused collaborators with limited project permissions.",
          pendingInvites: "Pending invites",
          pendingInvitesHelp:
            "Outstanding links waiting for invited teammates to accept access.",
          searchMembers: "Search members by name or email",
          allRoles: "All roles",
          visible: "visible",
          filter: "Filter",
          search: "Search",
          page: "Page",
          of: "of",
          noMembersTitle: "No members yet",
          noMembersDescription:
            "Once teammates are added to this project, they will appear here with roles and joined dates.",
          noMembersMatchTitle: "No members match the current filters",
          noMembersMatchDescription:
            "Try another search term or switch the selected role filter to bring teammates back into view.",
          member: "Member",
          email: "Email",
          role: "Role",
          joined: "Joined",
          actions: "Actions",
          ownerRoleLocked:
            "Owner role stays fixed here. Use project settings to transfer ownership safely.",
          selfRoleLocked:
            "Use a dedicated self-service flow to change your own project role later.",
          roleSaved: "Role changes are saved directly to the backend.",
          cannotManageRoles:
            "Only owners and admins can manage roles in this project.",
          remove: "Remove",
          showing: "Showing",
          previous: "Previous",
          next: "Next",
          invitations: "Invitations",
          invitationsHelp:
            "Track active invite links and share them with teammates who are not yet in the project.",
          searchInvitations: "Search invitations by email",
          allStatuses: "All statuses",
          loadingInvitations: "Loading invitations...",
          invitationsUnavailableTitle: "Invitations unavailable",
          invitationsUnavailableDescription:
            "The project invitation list could not be loaded from the backend.",
          noInvitationsTitle: "No invitations yet",
          noInvitationsDescription:
            "Create an invite link to let a teammate join this project after they sign in.",
          createInvitation: "Create invitation",
          noInvitationsMatchTitle: "No invitations match the current filters",
          noInvitationsMatchDescription:
            "Adjust the email search or invitation status filter to reveal matching invite links.",
          created: "Created",
          expires: "Expires",
          resend: "Resend",
          copyLink: "Copy link",
          cancel: "Cancel",
          inviteLinkCopied: "Invite link copied",
          copyFailed: "Copy failed",
          copyFailedDescription:
            "Your browser blocked clipboard access for the invitation link.",
          removeMemberTitle: "Remove member",
          removeMemberConfirm: "Remove member",
          removeMemberDescription: (email: string, project: string) =>
            `Remove ${email} from ${project}? They will lose access until someone adds them again.`,
          roleLabels: {
            OWNER: "Owner",
            ADMIN: "Admin",
            MEMBER: "Member",
            VIEWER: "Viewer",
          } as Record<MemberRole | "OWNER", string>,
          invitationStatuses: {
            PENDING: "Pending",
            ACCEPTED: "Accepted",
            REJECTED: "Rejected",
            CANCELED: "Canceled",
          } as Record<ProjectInvitation["status"], string>,
        };
  const resetLabel = language === "vi" ? "Đặt lại" : "Reset";
  const memberRoleFilterOptions: FilterDropdownOption[] = memberFilterOptions.map((role) => ({
    value: role,
    label: role === "ALL" ? ui.allRoles : ui.roleLabels[role],
  }));
  const memberRoleFilterLabel =
    memberRoleFilter === "ALL" ? ui.allRoles : ui.roleLabels[memberRoleFilter];
  const inviteStatusFilterOptions: FilterDropdownOption[] = invitationStatusOptions.map(
    (status) => ({
      value: status,
      label: status === "ALL" ? ui.allStatuses : ui.invitationStatuses[status],
    })
  );
  const inviteStatusFilterLabel =
    inviteStatusFilter === "ALL"
      ? ui.allStatuses
      : ui.invitationStatuses[inviteStatusFilter];

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId]);

  useEffect(() => {
    setMemberPage(1);
  }, [selectedProjectId, deferredMemberSearch, memberRoleFilter]);

  const selectedProject =
    projectsQuery.data?.find((project) => project.id === selectedProjectId) ?? null;
  const allMembers = allMembersQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const currentMember =
    allMembers.find((member) => member.userId === String(currentUser?.id)) ?? null;
  const canManageMembers =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const filteredInvitations = useMemo(() => {
    const normalizedSearch = inviteSearch.trim().toLowerCase();

    return invitations.filter((invitation) => {
      const matchesSearch =
        normalizedSearch === ""
          ? true
          : invitation.email.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        inviteStatusFilter === "ALL" ? true : invitation.status === inviteStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inviteSearch, inviteStatusFilter, invitations]);
  const totalMemberPages = Math.max(1, Math.ceil(members.length / membersPerPage));
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * membersPerPage;
    return members.slice(start, start + membersPerPage);
  }, [memberPage, members]);

  useEffect(() => {
    if (memberPage > totalMemberPages) {
      setMemberPage(totalMemberPages);
    }
  }, [memberPage, totalMemberPages]);

  const summary = {
    total: allMembers.length,
    admins: allMembers.filter((member) => ["OWNER", "ADMIN"].includes(member.role))
      .length,
    viewers: allMembers.filter((member) => member.role === "VIEWER").length,
    pendingInvites: invitations.filter((invitation) => invitation.status === "PENDING").length,
  };
  const hasActiveMemberFilters =
    Boolean(deferredMemberSearch.trim()) || memberRoleFilter !== "ALL";
  const hasActiveInvitationFilters =
    Boolean(inviteSearch.trim()) || inviteStatusFilter !== "ALL";

  async function copyInviteLink(token: string) {
    const invitationUrl = `${window.location.origin}/invite/${token}`;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      useToastStore.getState().push({
        title: ui.inviteLinkCopied,
        description: invitationUrl,
        variant: "success",
      });
    } catch {
      useToastStore.getState().push({
        title: ui.copyFailed,
        description: ui.copyFailedDescription,
        variant: "error",
      });
    }
  }

  if (
    projectsQuery.isPending ||
    (selectedProjectId && (membersQuery.isPending || allMembersQuery.isPending))
  ) {
    return (
      <LoadingState
        title={ui.loadingTitle}
        description={ui.loadingDescription}
      />
    );
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        title={ui.unavailableTitle}
        description={ui.unavailableDescription}
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  if (!projectsQuery.data?.length) {
    return (
      <EmptyState
        icon={<Users />}
        title={ui.noProjectsTitle}
        description={ui.noProjectsDescription}
      />
    );
  }

  if (membersQuery.isError || allMembersQuery.isError) {
    return (
      <ErrorState
        title={ui.unavailableTitle}
        description={
          language === "vi"
            ? "Không thể tải danh sách thành viên của dự án từ backend. Hãy thử lại để khôi phục trang."
            : "The project member roster could not be loaded from the backend. Retry to restore the page."
        }
        onRetry={() => void membersQuery.refetch()}
      />
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {ui.workspace}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">{ui.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {ui.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            className="gap-2"
            onClick={() => setIsAddOpen(true)}
            disabled={!canManageMembers}
          >
            <Plus />
            {ui.addMember}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setIsInviteOpen(true)}
            disabled={!canManageMembers}
          >
            <Link2 />
            {ui.inviteByEmail}
          </Button>
          <select
            className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            {projectsQuery.data.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <Badge variant="secondary" className="px-3 py-1">
            {summary.total} {ui.members}
          </Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{ui.totalMembers}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.total}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.totalMembersHelp(selectedProject?.name ?? (language === "vi" ? "dự án này" : "this project"))}
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{ui.elevatedRoles}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.admins}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.elevatedRolesHelp}
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{ui.viewers}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.viewers}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.viewersHelp}
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{ui.pendingInvites}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{summary.pendingInvites}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {ui.pendingInvitesHelp}
          </p>
        </article>
      </section>

        <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder={ui.searchMembers}
            />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <FilterDropdownChip
                label={ui.filter}
                value={memberRoleFilter}
                currentLabel={memberRoleFilterLabel}
                options={memberRoleFilterOptions}
                onChange={(value) => setMemberRoleFilter(value as "ALL" | MemberRole)}
                active={memberRoleFilter !== "ALL"}
              />
              <Badge variant="secondary" className="px-3 py-1">
                {members.length} {ui.visible}
              </Badge>
              {hasActiveMemberFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMemberSearch("");
                    setMemberRoleFilter("ALL");
                  }}
                >
                  {resetLabel}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {ui.page} {memberPage} {ui.of} {totalMemberPages}
            </p>
          </div>
        </section>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={ui.noMembersTitle}
          description={ui.noMembersDescription}
          action={
            <Button
              type="button"
              className="gap-2"
              onClick={() => setIsAddOpen(true)}
              disabled={!canManageMembers}
            >
              <Plus />
              {ui.addMember}
            </Button>
          }
        />
      ) : paginatedMembers.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={ui.noMembersMatchTitle}
          description={ui.noMembersMatchDescription}
        />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">{ui.member}</th>
                  <th className="px-6 py-4 font-medium">{ui.email}</th>
                  <th className="px-6 py-4 font-medium">{ui.role}</th>
                  <th className="px-6 py-4 font-medium">{ui.joined}</th>
                  <th className="px-6 py-4 font-medium">{ui.actions}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} email={member.email} className="size-10" />
                        <div>
                          <p className="font-medium text-foreground">
                            {getDisplayName(member, member.email)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">{member.email}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-3">
                        <RoleBadge role={member.role} />
                        <select
                          className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          value={member.role}
                          disabled={
                            !canManageMembers ||
                            member.role === "OWNER" ||
                            member.userId === String(currentUser?.id) ||
                            updateMemberRole.isPending
                          }
                          onChange={(event) => {
                            void updateMemberRole.mutateAsync({
                              projectId: selectedProjectId,
                              memberId: member.id,
                              role: event.target.value as MemberRole,
                            });
                          }}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {ui.roleLabels[role]}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          {member.role === "OWNER"
                            ? ui.ownerRoleLocked
                            : member.userId === String(currentUser?.id)
                              ? ui.selfRoleLocked
                              : canManageMembers
                                ? ui.roleSaved
                                : ui.cannotManageRoles}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">
                      {formatCalendarDate(member.joinedAt)}
                    </td>
                    <td className="px-6 py-5">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          !canManageMembers ||
                          member.role === "OWNER" ||
                          member.userId === String(currentUser?.id) ||
                          removeMember.isPending
                        }
                        onClick={() =>
                          setMemberRemovalTarget({
                            id: member.id,
                            email: member.email,
                          })
                        }
                      >
                        {ui.remove}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {ui.showing} {(memberPage - 1) * membersPerPage + 1}-
              {Math.min(memberPage * membersPerPage, members.length)} {ui.of} {members.length} {ui.members}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={memberPage === 1}
                onClick={() => setMemberPage((current) => Math.max(1, current - 1))}
              >
                {ui.previous}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={memberPage >= totalMemberPages}
                onClick={() =>
                  setMemberPage((current) => Math.min(totalMemberPages, current + 1))
                }
              >
                {ui.next}
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-border bg-background/95 shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <h3 className="text-lg font-semibold">{ui.invitations}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {ui.invitationsHelp}
          </p>
        </div>

        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                value={inviteSearch}
                onChange={(event) => setInviteSearch(event.target.value)}
                placeholder={ui.searchInvitations}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <FilterDropdownChip
                label={ui.filter}
                value={inviteStatusFilter}
                currentLabel={inviteStatusFilterLabel}
                options={inviteStatusFilterOptions}
                onChange={(value) =>
                  setInviteStatusFilter(value as "ALL" | ProjectInvitation["status"])
                }
                active={inviteStatusFilter !== "ALL"}
              />
              <Badge variant="secondary" className="px-3 py-1">
                {filteredInvitations.length} {ui.visible}
              </Badge>
              {hasActiveInvitationFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInviteSearch("");
                    setInviteStatusFilter("ALL");
                  }}
                >
                  {resetLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {invitationsQuery.isPending ? (
          <div className="px-6 py-8 text-sm text-muted-foreground">
            {ui.loadingInvitations}
          </div>
        ) : invitationsQuery.isError ? (
          <div className="px-6 py-8">
            <ErrorState
              title={ui.invitationsUnavailableTitle}
              description={ui.invitationsUnavailableDescription}
              onRetry={() => void invitationsQuery.refetch()}
            />
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Link2 />}
              title={ui.noInvitationsTitle}
              description={ui.noInvitationsDescription}
              action={
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => setIsInviteOpen(true)}
                  disabled={!canManageMembers}
                >
                  <Link2 />
                  {ui.createInvitation}
                </Button>
              }
            />
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Link2 />}
              title={ui.noInvitationsMatchTitle}
              description={ui.noInvitationsMatchDescription}
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredInvitations.map((invitation) => (
              <article
                key={invitation.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{invitation.email}</p>
                    <RoleBadge role={invitation.role} />
                    <Badge
                      variant={
                        invitation.status === "PENDING" ? "secondary" : "outline"
                      }
                      className="px-3 py-1"
                    >
                      {ui.invitationStatuses[invitation.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ui.created} {formatCalendarDate(invitation.createdAt)}. {ui.expires}{" "}
                    {formatCalendarDate(invitation.expiresAt)}.
                  </p>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    /invite/{invitation.tokenPreview ? `********${invitation.tokenPreview}` : "********"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={
                      invitation.status !== "PENDING" ||
                      resendInvitation.isPending ||
                      cancelInvitation.isPending
                    }
                    onClick={() =>
                      void resendInvitation.mutateAsync({
                        projectId: selectedProjectId,
                        invitationId: invitation.id,
                      })
                    }
                  >
                    <Link2 className="size-4" />
                    {ui.resend}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={
                      invitation.status !== "PENDING" ||
                      resendInvitation.isPending ||
                      cancelInvitation.isPending
                    }
                    onClick={() => {
                      void (async () => {
                        const refreshed = await resendInvitation.mutateAsync({
                          projectId: selectedProjectId,
                          invitationId: invitation.id,
                        });

                        if (!refreshed.token) {
                          useToastStore.getState().push({
                            title: ui.copyFailed,
                            description: ui.copyFailedDescription,
                            variant: "error",
                          });
                          return;
                        }

                        await copyInviteLink(refreshed.token);
                      })();
                    }}
                  >
                    <Copy className="size-4" />
                    {ui.copyLink}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={
                      invitation.status !== "PENDING" ||
                      resendInvitation.isPending ||
                      cancelInvitation.isPending
                    }
                    onClick={() =>
                      void cancelInvitation.mutateAsync({
                        projectId: selectedProjectId,
                        invitationId: invitation.id,
                      })
                    }
                  >
                    <X className="size-4" />
                    {ui.cancel}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AddMemberModal
        open={isAddOpen}
        projectName={selectedProject?.name}
        isPending={addMember.isPending}
        onClose={() => setIsAddOpen(false)}
        onAdd={(input) =>
          addMember.mutateAsync({
            projectId: selectedProjectId,
            email: input.email,
            role: input.role,
          })
        }
      />

      <InviteMemberModal
        open={isInviteOpen}
        projectName={selectedProject?.name}
        isPending={createInvitation.isPending}
        onClose={() => setIsInviteOpen(false)}
        onInvite={(input) =>
          createInvitation.mutateAsync({
            projectId: selectedProjectId,
            email: input.email,
            role: input.role,
          })
        }
      />

      <ConfirmDialog
        open={Boolean(memberRemovalTarget)}
        title={ui.removeMemberTitle}
        description={ui.removeMemberDescription(
          memberRemovalTarget?.email ?? (language === "vi" ? "thành viên này" : "this teammate"),
          selectedProject?.name ?? (language === "vi" ? "dự án này" : "this project")
        )}
        confirmLabel={ui.removeMemberConfirm}
        tone="danger"
        isPending={removeMember.isPending}
        onClose={() => setMemberRemovalTarget(null)}
        onConfirm={async () => {
          if (!memberRemovalTarget) {
            return;
          }

          await removeMember.mutateAsync({
            projectId: selectedProjectId,
            memberId: memberRemovalTarget.id,
          });
          setMemberRemovalTarget(null);
        }}
      />
    </section>
  );
}
