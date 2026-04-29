import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FolderKanban,
  Link2,
  ListTodo,
  MessageSquare,
  Plus,
  Settings2,
  Users,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { ActivityList } from "@/dashboard/components/ActivityList";
import { StatCard } from "@/dashboard/components/StatCard";
import { useAuthStore } from "@/auth/store/authStore";
import { useI18n } from "@/i18n/useI18n";
import { InviteMemberModal } from "@/invitations/components/InviteMemberModal";
import { useCreateInvitationMutation } from "@/invitations/hooks/useCreateInvitationMutation";
import { ProjectHeader } from "@/projects/components/ProjectHeader";
import { ManageProjectModal } from "@/projects/components/ManageProjectModal";
import { ProjectTabs } from "@/projects/components/ProjectTabs";
import { useDeleteProjectMutation } from "@/projects/hooks/useDeleteProjectMutation";
import { useProjectActivity } from "@/projects/hooks/useProjectActivity";
import { useLeaveProjectMutation } from "@/projects/hooks/useLeaveProjectMutation";
import { useProjectDetail } from "@/projects/hooks/useProjectDetail";
import { useTransferProjectOwnershipMutation } from "@/projects/hooks/useTransferProjectOwnershipMutation";
import { useUpdateProjectMutation } from "@/projects/hooks/useUpdateProjectMutation";
import { getDisplayName } from "@/shared/lib/display";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CreateTaskModal } from "@/tasks/components/CreateTaskModal";
import { useCreateTaskMutation } from "@/tasks/hooks/useCreateTaskMutation";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { LoadingState } from "@/shared/ui/loading-state";
import {
  canManageProject,
  canTransferProjectOwnership,
} from "@/shared/lib/workspace-permissions";
import { StatusBadge } from "@/shared/ui/status-badge";

export function ProjectDetailPage() {
  const { language } = useI18n();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const ui =
    language === "vi"
      ? {
          tabs: {
            overview: "Tổng quan",
            activity: "Hoạt động",
            tasks: "Công việc",
            members: "Thành viên",
            messages: "Tin nhắn",
          },
          loadingTitle: "Chi tiết dự án",
          loadingDescription:
            "Đang tải phần tóm tắt dự án, các tab, task và hoạt động gần đây.",
          unavailableTitle: "Không thể tải chi tiết dự án",
          unavailableDescription:
            "Không thể tải trang chi tiết dự án từ backend. Hãy thử lại để khôi phục trang.",
          backToProjects: "Quay lại danh sách dự án",
          createTask: "Tạo task",
          inviteMember: "Mời thành viên",
          projectSettings: "Cài đặt dự án",
          openTaskWorkflow: "Mở luồng task",
          openTaskWorkflowHelp:
            "Tạo task mới ngay trong dự án này và tiếp tục luồng delivery mà không cần rời khỏi trang chi tiết.",
          openBoardView: "Mở chế độ board",
          openBoardViewHelp:
            "Chuyển sang task board đầy đủ để lọc, kéo thả và xử lý execution sâu hơn.",
          openProjectChat: "Mở chat dự án",
          openProjectChatHelp:
            "Tiếp tục cuộc trò chuyện dự án và các thông báo trong khu vực tin nhắn đầy đủ.",
          manageTeamAccess: "Quản lý quyền truy cập nhóm",
          manageTeamAccessHelp:
            "Xem thành viên dự án, link mời và vai trò quyền truy cập trong khu vực quản lý thành viên.",
          totalTasks: "Tổng task",
          totalTasksHelp: "Toàn bộ task hiện đang được theo dõi trong dự án này.",
          inProgress: "Đang làm",
          inProgressHelp: "Các task đang được xử lý để tiến tới hoàn thành.",
          done: "Hoàn tất",
          doneHelp: "Công việc đã được giao xong hoặc nghiệm thu.",
          membersStat: "Thành viên",
          membersStatHelp: "Số người hiện đang tham gia workspace dự án này.",
          taskStatus: "Trạng thái task",
          taskStatusHelp: "Ảnh chụp nhanh về phân bố công việc trong dự án.",
          timeline: "Dòng thời gian dự án",
          timelineHelp:
            "Feed hoạt động hợp nhất từ tin nhắn, báo cáo task và sự kiện lời mời.",
          activityUnavailableTitle: "Không thể tải timeline hoạt động",
          activityUnavailableDescription:
            "Không thể tải feed hoạt động dự án lúc này. Hãy thử lại để khôi phục timeline.",
          activityLoadingTitle: "Hoạt động dự án",
          activityLoadingDescription:
            "Đang tải timeline dự án, lời mời và các sự kiện delivery mới nhất.",
          tasks: "Công việc",
          tasksHelp: "Danh sách task hiện tại của dự án cùng người phụ trách và trạng thái.",
          noTasksTitle: "Dự án chưa có task",
          noTasksDescription:
            "Các task được thêm vào dự án sẽ xuất hiện tại đây cùng người phụ trách và trạng thái hiện tại.",
          assignee: "Người phụ trách",
          unassigned: "Chưa giao",
          openBoard: "Mở board",
          members: "Thành viên",
          membersHelp: "Những người đang tham gia workspace dự án này.",
          noMembersTitle: "Chưa có thành viên",
          noMembersDescription:
            "Cộng tác viên dự án sẽ xuất hiện tại đây khi đồng đội được thêm vào workspace.",
          messages: "Tin nhắn",
          messagesHelp: "Các cập nhật hội thoại gần đây cho dự án này.",
          noMessagesTitle: "Chưa có tin nhắn dự án",
          noMessagesDescription:
            "Các cập nhật trò chuyện và thông báo sẽ xuất hiện tại đây khi nhóm bắt đầu trao đổi.",
          openChat: "Mở chat",
          system: "Hệ thống",
        }
      : {
          tabs: {
            overview: "Overview",
            activity: "Activity",
            tasks: "Tasks",
            members: "Members",
            messages: "Messages",
          },
          loadingTitle: "Project detail",
          loadingDescription:
            "Loading project summary, tabs, tasks, and recent activity.",
          unavailableTitle: "Project detail unavailable",
          unavailableDescription:
            "The project detail could not be loaded from the backend. Retry to restore the page.",
          backToProjects: "Back to projects",
          createTask: "Create task",
          inviteMember: "Invite member",
          projectSettings: "Project settings",
          openTaskWorkflow: "Open task workflow",
          openTaskWorkflowHelp:
            "Create a new task in this project and keep delivery moving without leaving the detail page.",
          openBoardView: "Open board view",
          openBoardViewHelp:
            "Jump to the full task board for filtering, drag-and-drop planning, and deeper execution work.",
          openProjectChat: "Open project chat",
          openProjectChatHelp:
            "Continue project conversation and announcements in the full messages workspace.",
          manageTeamAccess: "Manage team access",
          manageTeamAccessHelp:
            "Review project members, invitation links, and access roles in the dedicated members area.",
          totalTasks: "Total tasks",
          totalTasksHelp: "All scoped tasks currently tracked for this project.",
          inProgress: "In progress",
          inProgressHelp: "Tasks actively moving toward completion.",
          done: "Done",
          doneHelp: "Completed work already shipped or accepted.",
          membersStat: "Members",
          membersStatHelp: "Current people assigned to this project workspace.",
          taskStatus: "Task status",
          taskStatusHelp: "Snapshot of work distribution across the project.",
          timeline: "Project timeline",
          timelineHelp:
            "A unified activity feed across messages, task reports, and invitation events.",
          activityUnavailableTitle: "Activity timeline unavailable",
          activityUnavailableDescription:
            "The project activity feed could not be loaded right now. Retry to restore the timeline.",
          activityLoadingTitle: "Project activity",
          activityLoadingDescription:
            "Loading the latest project timeline, invitations, and delivery events.",
          tasks: "Tasks",
          tasksHelp: "Current project tasks with assignee and status.",
          noTasksTitle: "No tasks in this project",
          noTasksDescription:
            "Tasks added to the project will appear here with their current owner and status.",
          assignee: "Assignee",
          unassigned: "Unassigned",
          openBoard: "Open board",
          members: "Members",
          membersHelp: "Team members participating in this project workspace.",
          noMembersTitle: "No members assigned",
          noMembersDescription:
            "Project collaborators will appear here once teammates are added to the workspace.",
          messages: "Messages",
          messagesHelp: "Recent conversation updates for this project.",
          noMessagesTitle: "No project messages yet",
          noMessagesDescription:
            "Conversation updates and announcements will appear here when the team starts chatting.",
          openChat: "Open chat",
          system: "System",
        };
  const detailQuery = useProjectDetail(projectId);
  const activityQuery = useProjectActivity(projectId);
  const updateProject = useUpdateProjectMutation();
  const deleteProject = useDeleteProjectMutation();
  const leaveProject = useLeaveProjectMutation();
  const transferOwnership = useTransferProjectOwnershipMutation();
  const createTask = useCreateTaskMutation();
  const createInvitation = useCreateInvitationMutation();
  const project = detailQuery.data;
  const activityItems = activityQuery.data ?? project?.recentActivity ?? [];
  const currentMember = useMemo(
    () =>
      (project?.members ?? []).find(
        (member) => member.userId === String(currentUser?.id)
      ) ?? null,
    [currentUser?.id, project?.members]
  );
  const canManageProjectAccess = canManageProject(currentMember?.role);
  const canCreateTask = currentMember?.role !== "VIEWER";
  const canInviteMembers = canManageProjectAccess;
  const canDeleteProject = currentMember?.role === "OWNER";
  const canTransferOwnership = canTransferProjectOwnership(currentMember?.role);
  const canOpenSettings = Boolean(currentMember);
  const projectAsListItem = {
    id: project?.id ?? "",
    name: project?.name ?? "",
    description: project?.description ?? null,
    memberCount: project?.memberCount ?? 0,
    progress: project?.progress ?? 0,
    status: project?.status ?? "PLANNING",
    updatedAt: project?.updatedAt ?? new Date(0).toISOString(),
  };

  if (detailQuery.isPending) {
    return (
      <LoadingState
        title={ui.loadingTitle}
        description={ui.loadingDescription}
        statCount={4}
        bodyClassName="h-[28rem]"
      />
    );
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        title={ui.unavailableTitle}
        description={ui.unavailableDescription}
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <section className="flex flex-col gap-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft />
        {ui.backToProjects}
      </Link>

      <ProjectHeader
        project={project}
        actions={
          <>
            {canCreateTask ? (
              <Button
                type="button"
                className="gap-2"
                onClick={() => setIsCreateTaskOpen(true)}
              >
                <Plus className="size-4" />
                {ui.createTask}
              </Button>
            ) : null}
            {canInviteMembers ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setIsInviteOpen(true)}
              >
                <Link2 className="size-4" />
                {ui.inviteMember}
              </Button>
            ) : null}
            {canOpenSettings ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setIsManageOpen(true)}
              >
                <Settings2 className="size-4" />
                {ui.projectSettings}
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          className="rounded-3xl border border-border bg-background/95 p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
          onClick={() => setIsCreateTaskOpen(true)}
          disabled={!canCreateTask}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{ui.openTaskWorkflow}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {ui.openTaskWorkflowHelp}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/50 p-3">
              <ListTodo className="size-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          className="rounded-3xl border border-border bg-background/95 p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
          onClick={() => navigate("/tasks")}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{ui.openBoardView}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {ui.openBoardViewHelp}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/50 p-3">
              <FolderKanban className="size-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          className="rounded-3xl border border-border bg-background/95 p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
          onClick={() => navigate("/messages")}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{ui.openProjectChat}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {ui.openProjectChatHelp}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/50 p-3">
              <MessageSquare className="size-5" />
            </div>
          </div>
        </button>

        <button
          type="button"
          className="rounded-3xl border border-border bg-background/95 p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
          onClick={() => navigate("/members")}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{ui.manageTeamAccess}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {ui.manageTeamAccessHelp}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/50 p-3">
              <Users className="size-5" />
            </div>
          </div>
        </button>
      </section>

      <ProjectTabs
        items={[
          { id: "overview", label: ui.tabs.overview },
          { id: "activity", label: ui.tabs.activity },
          { id: "tasks", label: ui.tabs.tasks },
          { id: "members", label: ui.tabs.members },
          { id: "messages", label: ui.tabs.messages },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "overview" ? (
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={ui.totalTasks}
              value={project.totalTasks}
              helper={ui.totalTasksHelp}
              icon={<ListTodo />}
              tone="accent"
            />
            <StatCard
              label={ui.inProgress}
              value={project.tasksByStatus.IN_PROGRESS}
              helper={ui.inProgressHelp}
              icon={<ListTodo />}
            />
            <StatCard
              label={ui.done}
              value={project.tasksByStatus.DONE}
              helper={ui.doneHelp}
              icon={<CheckCircle2 />}
            />
            <StatCard
              label={ui.membersStat}
              value={project.memberCount}
              helper={ui.membersStatHelp}
              icon={<Users />}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <ActivityList items={activityItems} />

            <div className="rounded-3xl border border-border bg-background/95 p-6 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">{ui.taskStatus}</h3>
                <p className="text-sm text-muted-foreground">
                  {ui.taskStatusHelp}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {Object.entries(project.tasksByStatus).map(([status, count]) => (
                  <div key={status} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge value={status as keyof typeof project.tasksByStatus} />
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-foreground/80"
                        style={{
                          width: `${project.totalTasks ? (count / project.totalTasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <section className="rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-lg font-semibold">{ui.timeline}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ui.timelineHelp}
            </p>
          </div>
          <div className="p-6">
            {activityQuery.isError ? (
              <ErrorState
                title={ui.activityUnavailableTitle}
                description={ui.activityUnavailableDescription}
                onRetry={() => void activityQuery.refetch()}
              />
            ) : activityQuery.isPending && activityItems.length === 0 ? (
              <LoadingState
                title={ui.activityLoadingTitle}
                description={ui.activityLoadingDescription}
                bodyClassName="h-[20rem]"
              />
            ) : (
              <ActivityList items={activityItems} />
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "tasks" ? (
        <section className="rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-lg font-semibold">{ui.tasks}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ui.tasksHelp}
            </p>
          </div>
          {project.tasks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<ListTodo />}
                title={ui.noTasksTitle}
                description={ui.noTasksDescription}
                action={
                  canCreateTask ? (
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={() => setIsCreateTaskOpen(true)}
                    >
                      <Plus className="size-4" />
                      {ui.createTask}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {project.tasks.map((task) => (
                <article
                  key={task.id}
                  className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ui.assignee}: {getDisplayName(task.assignee, ui.unassigned)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={task.status} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/tasks")}
                    >
                      {ui.openBoard}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "members" ? (
        <section className="rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-lg font-semibold">{ui.members}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ui.membersHelp}
            </p>
          </div>
          {project.members.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Users />}
                title={ui.noMembersTitle}
                description={ui.noMembersDescription}
                action={
                  canInviteMembers ? (
                    <Button
                      type="button"
                      className="gap-2"
                      onClick={() => setIsInviteOpen(true)}
                    >
                      <Link2 className="size-4" />
                      {ui.inviteMember}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {project.members.map((member) => (
                <article
                  key={member.id}
                  className="flex flex-col gap-2 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {getDisplayName(member, member.email)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "messages" ? (
        <section className="rounded-3xl border border-border bg-background/95 shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h3 className="text-lg font-semibold">{ui.messages}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ui.messagesHelp}
            </p>
          </div>
          {project.messages.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<MessageSquare />}
                title={ui.noMessagesTitle}
                description={ui.noMessagesDescription}
                action={
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => navigate("/messages")}
                  >
                    <MessageSquare className="size-4" />
                    {ui.openChat}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {project.messages.map((message) => (
                <article key={message.id} className="px-6 py-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">
                      {getDisplayName(message.author, ui.system)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatRelativeDate(message.createdAt)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <div className="rounded-2xl border border-border bg-secondary/70 p-3">
                      <MessageSquare />
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {message.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <ManageProjectModal
        open={isManageOpen}
        project={project}
        currentUserId={currentUser?.id ? String(currentUser.id) : null}
        canManageProject={canManageProjectAccess}
        canDeleteProject={Boolean(canDeleteProject)}
        canTransferOwnership={Boolean(canTransferOwnership)}
        isSaving={updateProject.isPending}
        isDeleting={deleteProject.isPending}
        isLeaving={leaveProject.isPending}
        isTransferring={transferOwnership.isPending}
        onClose={() => setIsManageOpen(false)}
        onSave={(input) => updateProject.mutateAsync(input)}
        onDelete={async (targetProjectId) => {
          await deleteProject.mutateAsync(targetProjectId);
          navigate("/projects", { replace: true });
        }}
        onLeaveProject={async (targetProjectId) => {
          await leaveProject.mutateAsync(targetProjectId);
          navigate("/projects", { replace: true });
        }}
        onTransferOwnership={(input) =>
          transferOwnership.mutateAsync(input)
        }
      />

      <CreateTaskModal
        open={isCreateTaskOpen}
        projects={[projectAsListItem]}
        defaultProjectId={project.id}
        isPending={createTask.isPending}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreate={(input) => createTask.mutateAsync(input)}
      />

      <InviteMemberModal
        open={isInviteOpen}
        projectName={project.name}
        isPending={createInvitation.isPending}
        onClose={() => setIsInviteOpen(false)}
        onInvite={(input) =>
          createInvitation.mutateAsync({
            projectId: project.id,
            email: input.email,
            role: input.role,
          })
        }
      />
    </section>
  );
}
