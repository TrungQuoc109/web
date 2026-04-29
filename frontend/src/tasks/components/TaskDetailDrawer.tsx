import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  FileText,
  Link2,
  Paperclip,
  PencilLine,
  ShieldCheck,
  Trash2,
  UserPlus2,
  X,
} from "lucide-react";

import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useI18n } from "@/i18n/useI18n";
import { useRealtimeTaskRoom } from "@/realtime/hooks/useRealtimeTaskRoom";
import { getDisplayName, getDisplayText } from "@/shared/lib/display";
import { formatRelativeDate } from "@/shared/lib/format-date";
import { env } from "@/shared/config/env";
import { PriorityBadge } from "@/shared/ui/priority-badge";
import { StatusBadge } from "@/shared/ui/status-badge";
import type {
  TaskAssignmentRole,
  TaskItem,
  TaskReport,
  TaskStatus,
  TaskUser,
} from "@/tasks/types/task";
import type { TaskPriority } from "@/shared/types/workspace";
import { useUploadTaskReportAttachmentsMutation } from "@/uploads/hooks/useUploadTaskReportAttachmentsMutation";

type TaskDetailDrawerProps = {
  task: TaskItem | null;
  availableUsers: TaskUser[];
  reports: TaskReport[];
  commentDraft: string;
  currentUserId?: string | null;
  isCommentsLoading?: boolean;
  isUsersLoading?: boolean;
  isReportsLoading?: boolean;
  isStatusUpdating?: boolean;
  isAssigningUser?: boolean;
  isUpdatingAssignment?: boolean;
  isRemovingAssignment?: boolean;
  isSendingComment?: boolean;
  isSubmittingReport?: boolean;
  isReviewingReport?: boolean;
  isSavingTask?: boolean;
  isDeletingTask?: boolean;
  canEditPriority?: boolean;
  open: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onSaveTask: (
    taskId: string,
    input: { title: string; description?: string; priority: TaskPriority }
  ) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
  onAssignUser: (
    taskId: string,
    userId: string,
    role: TaskAssignmentRole
  ) => void;
  onUpdateAssignmentRole: (
    taskId: string,
    assignmentId: string,
    role: TaskAssignmentRole
  ) => void;
  onRemoveAssignment: (taskId: string, assignmentId: string) => Promise<unknown>;
  onCommentDraftChange: (taskId: string, draft: string) => void;
  onSendComment: (taskId: string, content: string) => Promise<unknown>;
  onSubmitReport: (
    taskId: string,
    input: { content: string; attachments?: string[] }
  ) => Promise<unknown>;
  onReviewReport: (
    reportId: string,
    taskId: string,
    input: {
      status: "APPROVED" | "REJECTED";
      feedback?: string;
      rejectionReason?: string;
    }
  ) => Promise<unknown>;
};

const statusOptions: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
];

const priorityOptions: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const assignmentRoleOptions: TaskAssignmentRole[] = ["CONTRIBUTOR", "LEAD"];

export function TaskDetailDrawer({
  task,
  availableUsers,
  reports,
  commentDraft,
  currentUserId,
  isCommentsLoading = false,
  isUsersLoading = false,
  isReportsLoading = false,
  isStatusUpdating = false,
  isAssigningUser = false,
  isUpdatingAssignment = false,
  isRemovingAssignment = false,
  isSendingComment = false,
  isSubmittingReport = false,
  isReviewingReport = false,
  isSavingTask = false,
  isDeletingTask = false,
  canEditPriority = true,
  open,
  onClose,
  onStatusChange,
  onPriorityChange,
  onSaveTask,
  onDeleteTask,
  onAssignUser,
  onUpdateAssignmentRole,
  onRemoveAssignment,
  onCommentDraftChange,
  onSendComment,
  onSubmitReport,
  onReviewReport,
}: TaskDetailDrawerProps) {
  const { language } = useI18n();
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM");
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [assignmentRole, setAssignmentRole] =
    useState<TaskAssignmentRole>("CONTRIBUTOR");
  const [reportContent, setReportContent] = useState("");
  const [reportAttachments, setReportAttachments] = useState("");
  const [uploadedAttachmentUrls, setUploadedAttachmentUrls] = useState<string[]>([]);
  const [reportError, setReportError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [assignmentRemovalTarget, setAssignmentRemovalTarget] = useState<{
    assignmentId: string;
    userEmail: string;
  } | null>(null);
  const reportAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const uploadReportAttachments = useUploadTaskReportAttachmentsMutation();
  const ui =
    language === "vi"
      ? {
          detail: "Chi tiết task",
          noDescription: "Chưa có mô tả.",
          closeDrawer: "Đóng khung chi tiết",
          taskDetails: "Thông tin task",
          taskDetailsHelp:
            "Cập nhật tiêu đề, mô tả và mức ưu tiên kế hoạch mà không cần rời khỏi board.",
          taskTitle: "Tiêu đề task",
          description: "Mô tả",
          planningPriority: "Ưu tiên kế hoạch",
          priorityLabels: {
            LOW: "Thấp",
            MEDIUM: "Trung bình",
            HIGH: "Cao",
            URGENT: "Khẩn cấp",
          } as Record<TaskPriority, string>,
          saving: "Đang lưu...",
          saveTaskDetails: "Lưu thông tin task",
          status: "Trạng thái",
          statusHelp: "Di chuyển task qua các giai đoạn delivery.",
          statusHint:
            "Bạn có thể chuyển task sang giai đoạn duyệt tại đây, nhưng việc hoàn tất cuối cùng phải đi qua bước duyệt báo cáo.",
          priority: "Ưu tiên",
          priorityHelp: "Cập nhật mức độ khẩn dựa trên ảnh hưởng tới delivery.",
          dangerZone: "Vùng nguy hiểm",
          dangerZoneHelp:
            "Xóa task khi hạng mục công việc này cần bị loại khỏi dự án hoàn toàn.",
          deleting: "Đang xóa...",
          deleteTask: "Xóa task",
          assignees: "Người phụ trách",
          assigneesHelp:
            "Giao đồng đội vào task và xác định ai lead, ai là contributor.",
          noAssignees: "Chưa có người phụ trách",
          removing: "Đang gỡ...",
          remove: "Gỡ",
          assignUser: "Giao người dùng",
          selectTeammate: "Chọn đồng đội",
          role: "Vai trò",
          loadingMembers: "Đang tải thành viên dự án...",
          reports: "Báo cáo task",
          reportsHelp:
            "Contributor nộp bằng chứng delivery tại đây, và task lead sẽ duyệt trước khi task được hoàn tất.",
          submitReport: "Gửi báo cáo",
          submitReportHelp: "Mô tả những gì đã hoàn tất, đã kiểm thử hoặc sẵn sàng để duyệt.",
          attachments: "Tệp đính kèm",
          attachmentsHelp:
            "Tải lên ảnh chụp màn hình, PDF, ghi chú hoặc file nén trước khi gửi báo cáo.",
          uploading: "Đang tải lên...",
          uploadFiles: "Tải file lên",
          externalAttachmentPlaceholder: "Link tệp đính kèm bên ngoài, mỗi dòng một link",
          attachmentsHint:
            "File tải lên sẽ được lưu ở backend và tự động gắn vào báo cáo. Bạn vẫn có thể dán thêm link ngoài khi cần.",
          submitting: "Đang gửi...",
          submit: "Gửi báo cáo",
          leadReview: "Lead duyệt",
          leadReviewHelp:
            "Phê duyệt khi deliverable đã hoàn chỉnh, hoặc từ chối kèm phản hồi cụ thể.",
          reviewPlaceholder: "Phản hồi khi duyệt hoặc lý do từ chối",
          reject: "Từ chối",
          approve: "Phê duyệt",
          reportHistory: "Lịch sử báo cáo",
          reportStatuses: {
            PENDING: "Chờ duyệt",
            APPROVED: "Đã duyệt",
            REJECTED: "Từ chối",
          } as Record<TaskReport["status"], string>,
          loadingReports: "Đang tải báo cáo task...",
          noReports: "Chưa có báo cáo nào",
          comments: "Bình luận",
          commentsHelp: "Thảo luận gần đây của task và các cập nhật hệ thống từ backend.",
          addComment: "Thêm bình luận",
          commentPlaceholder:
            "Chia sẻ cập nhật, đặt câu hỏi hoặc để lại ghi chú triển khai cho cả nhóm.",
          sending: "Đang gửi...",
          sendComment: "Gửi bình luận",
          commentsLoading: "Đang tải bình luận...",
          noComments: "Chưa có bình luận",
          mentionHelp:
            "Phần này cũng hỗ trợ nhắc tên. Hãy dùng định danh như @Ethan hoặc @ethan.walker để báo cho đồng đội được giao việc.",
          deleteTaskTitle: "Xóa task",
          removeAssigneeTitle: "Gỡ người phụ trách",
          removeAssigneeConfirm: "Gỡ người phụ trách",
          contributor: "Contributor",
          lead: "Lead",
        }
      : {
          detail: "Task detail",
          noDescription: "No description yet.",
          closeDrawer: "Close drawer",
          taskDetails: "Task details",
          taskDetailsHelp:
            "Update the task title, description, and planning priority without leaving the board.",
          taskTitle: "Task title",
          description: "Description",
          planningPriority: "Planning priority",
          priorityLabels: {
            LOW: "Low",
            MEDIUM: "Medium",
            HIGH: "High",
            URGENT: "Urgent",
          } as Record<TaskPriority, string>,
          saving: "Saving...",
          saveTaskDetails: "Save task details",
          status: "Status",
          statusHelp: "Move the task through the delivery flow.",
          statusHint:
            "Tasks can move into review here, but final completion must happen through report approval.",
          priority: "Priority",
          priorityHelp: "Update urgency based on delivery impact.",
          dangerZone: "Danger zone",
          dangerZoneHelp:
            "Delete the task when the work item should be removed from the project entirely.",
          deleting: "Deleting...",
          deleteTask: "Delete task",
          assignees: "Assignees",
          assigneesHelp:
            "Assign teammates and set whether they are leading the work or contributing to it.",
          noAssignees: "No assignees yet",
          removing: "Removing...",
          remove: "Remove",
          assignUser: "Assign user",
          selectTeammate: "Select teammate",
          role: "Role",
          loadingMembers: "Loading project members...",
          reports: "Task reports",
          reportsHelp:
            "Contributors submit delivery evidence here, and task leads review it before the task can be completed.",
          submitReport: "Submit your report",
          submitReportHelp: "Describe what was completed, tested, or ready for review.",
          attachments: "Attachments",
          attachmentsHelp:
            "Upload supporting files (images, PDFs, or archives) before submitting the report.",
          uploading: "Uploading...",
          uploadFiles: "Upload files",
          externalAttachmentPlaceholder: "Optional external attachment URLs, one per line",
          attachmentsHint:
            "Uploaded files are stored on the backend and added automatically. External links can still be pasted here when needed.",
          submitting: "Submitting...",
          submit: "Submit report",
          leadReview: "Lead review",
          leadReviewHelp:
            "Approve when the deliverable is complete, or reject with actionable feedback.",
          reviewPlaceholder: "Optional approval feedback or required rejection reason",
          reject: "Reject",
          approve: "Approve",
          reportHistory: "Report history",
          reportStatuses: {
            PENDING: "Pending",
            APPROVED: "Approved",
            REJECTED: "Rejected",
          } as Record<TaskReport["status"], string>,
          loadingReports: "Loading task reports...",
          noReports: "No reports submitted yet",
          comments: "Comments",
          commentsHelp: "Recent task discussion and system updates from the backend.",
          addComment: "Add comment",
          commentPlaceholder:
            "Share an update, ask a question, or leave a short message for the team.",
          sending: "Sending...",
          sendComment: "Send comment",
          commentsLoading: "Loading comments...",
          noComments: "No comments yet",
          mentionHelp:
            "Mentions are supported here too. Use handles like @Ethan or @ethan.walker to notify assigned teammates.",
          deleteTaskTitle: "Delete task",
          removeAssigneeTitle: "Remove assignee",
          removeAssigneeConfirm: "Remove assignee",
          contributor: "Contributor",
          lead: "Lead",
        };

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority);
    setDetailsError(null);
    setReportContent("");
    setReportAttachments("");
    setUploadedAttachmentUrls([]);
    setReportError(null);
    setUploadError(null);
    setReviewNotes("");
    setReviewError(null);
    setCommentError(null);
  }, [open, task]);

  useRealtimeTaskRoom(task?.id, open);

  const reportAttachmentLinks = useMemo(
    () =>
      uploadedAttachmentUrls.map((url) => ({
        url,
        href: url.startsWith("/uploads/") ? `${env.apiUrl}${url}` : url,
        label: url.split("/").pop() || url,
      })),
    [uploadedAttachmentUrls]
  );

  if (!open || !task) return null;
  const currentTask = task;

  const currentAssignment = currentUserId
    ? currentTask.assignees.find((assignee) => assignee.id === currentUserId)
    : null;
  const isLead = currentAssignment?.assignmentRole === "LEAD";
  const isContributor = currentAssignment?.assignmentRole === "CONTRIBUTOR";
  const pendingReports = reports.filter((report) => report.status === "PENDING");
  const canSubmitReport =
    isContributor &&
    currentTask.status !== "DONE" &&
    currentTask.status !== "BLOCKED";
  const canReviewReports =
    isLead && currentTask.status === "IN_REVIEW" && pendingReports.length > 0;
  const statusSelectOptions =
    currentTask.status === "DONE" ? ["DONE"] : statusOptions;
  const submitReportHint = !currentAssignment
    ? language === "vi"
      ? "Bạn cần được gán vào task này trước khi có thể gửi báo cáo delivery."
      : "You need to be assigned to this task before you can submit a delivery report."
    : isLead
      ? language === "vi"
        ? "Task lead là người duyệt báo cáo của task này. Hãy tự gán mình làm contributor nếu bạn cũng cần gửi báo cáo."
        : "Task leads review reports on this task. Assign yourself as a contributor if you also need to submit one."
      : currentTask.status === "DONE"
        ? language === "vi"
          ? "Task này đã hoàn tất nên không thể gửi thêm báo cáo mới."
          : "This task is already completed, so new reports can no longer be submitted."
        : currentTask.status === "BLOCKED"
          ? language === "vi"
            ? "Task đang bị chặn nên chưa thể nhận báo cáo mới cho tới khi blocker được gỡ."
            : "Blocked tasks cannot accept new reports until the blocker is resolved."
          : language === "vi"
            ? "Chỉ contributor mới có thể gửi báo cáo task để chờ duyệt."
            : "Only contributors can submit task reports for review.";
  const reviewReportHint = !currentAssignment
    ? language === "vi"
      ? "Bạn cần được gán làm lead của task trước khi có thể duyệt báo cáo."
      : "You need to be assigned as the task lead before review actions become available."
    : !isLead
      ? language === "vi"
        ? "Chỉ task lead mới có thể phê duyệt hoặc từ chối báo cáo của task này."
        : "Only the task lead can approve or reject reports for this task."
      : currentTask.status !== "IN_REVIEW"
        ? language === "vi"
          ? "Hãy chuyển task sang trạng thái Đang duyệt trước khi mở chức năng phê duyệt báo cáo."
          : "Move the task into In Review before report approvals become available."
        : pendingReports.length === 0
          ? language === "vi"
            ? "Các báo cáo chờ duyệt sẽ xuất hiện tại đây sau khi contributor nộp bằng chứng delivery."
            : "Pending reports will appear here once a contributor submits delivery evidence."
          : null;
  const assignmentRoleLabels: Record<TaskAssignmentRole, string> = {
    CONTRIBUTOR: ui.contributor,
    LEAD: ui.lead,
  };
  const statusLabels: Record<TaskStatus, string> = {
    TODO: language === "vi" ? "Cần làm" : "To do",
    IN_PROGRESS: language === "vi" ? "Đang làm" : "In progress",
    IN_REVIEW: language === "vi" ? "Đang duyệt" : "In review",
    BLOCKED: language === "vi" ? "Bị chặn" : "Blocked",
    DONE: language === "vi" ? "Hoàn tất" : "Done",
  };

  async function handleSubmitReport() {
    const content = reportContent.trim();
    const manualAttachments = reportAttachments
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const attachments = [...uploadedAttachmentUrls, ...manualAttachments];

    if (content.length < 10) {
      setReportError(
        language === "vi"
          ? "Hãy viết báo cáo với ít nhất 10 ký tự."
          : "Write a report with at least 10 characters."
      );
      return;
    }

    setReportError(null);
    await onSubmitReport(currentTask.id, {
      content,
      attachments: attachments.length ? attachments : undefined,
    });
    setReportContent("");
    setReportAttachments("");
    setUploadedAttachmentUrls([]);
    if (reportAttachmentInputRef.current) {
      reportAttachmentInputRef.current.value = "";
    }
  }

  async function handleUploadReportAttachments(
    files: FileList | null
  ): Promise<void> {
    if (!files?.length) {
      return;
    }

    setUploadError(null);

    const uploadedFiles = await uploadReportAttachments.mutateAsync(Array.from(files));
    setUploadedAttachmentUrls((current) => [
      ...current,
      ...uploadedFiles.map((file) => file.url),
    ]);

    if (reportAttachmentInputRef.current) {
      reportAttachmentInputRef.current.value = "";
    }
  }

  async function handleReviewReport(reportId: string, status: "APPROVED" | "REJECTED") {
    const note = reviewNotes.trim();

    if (status === "REJECTED" && note.length < 10) {
      setReviewError(
        language === "vi"
          ? "Hãy thêm lý do từ chối đủ chi tiết để contributor có thể xử lý."
          : "Add a rejection reason with enough detail for the contributor."
      );
      return;
    }

    setReviewError(null);
    await onReviewReport(reportId, currentTask.id, {
      status,
      feedback: status === "APPROVED" ? note || undefined : undefined,
      rejectionReason: status === "REJECTED" ? note : undefined,
    });
    setReviewNotes("");
  }

  async function handleSendComment() {
    const content = commentDraft.trim();

    if (!content) {
      setCommentError(
        language === "vi"
          ? "Hãy nhập bình luận trước khi gửi."
          : "Write a comment before sending."
      );
      return;
    }

    setCommentError(null);
    await onSendComment(currentTask.id, content);
    onCommentDraftChange(currentTask.id, "");
  }

  async function handleSaveTask() {
    const title = editTitle.trim();

    if (title.length < 3) {
      setDetailsError(
        language === "vi"
          ? "Tiêu đề task phải có ít nhất 3 ký tự."
          : "Task title must be at least 3 characters."
      );
      return;
    }

    setDetailsError(null);
    await onSaveTask(currentTask.id, {
      title,
      description: editDescription.trim() || undefined,
      priority: editPriority,
    });
  }

  async function handleDeleteTask() {
    await onDeleteTask(currentTask.id);
  }

  async function handleRemoveAssignment(assignmentId: string, userEmail: string) {
    await onRemoveAssignment(currentTask.id, assignmentId);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-[0_0_60px_-20px_rgba(15,23,42,0.35)]">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-6">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {ui.detail}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {currentTask.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getDisplayText(currentTask.description, ui.noDescription)}
            </p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={ui.closeDrawer}>
            <X />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-border bg-secondary/60 p-2">
                    <PencilLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ui.taskDetails}</p>
                    <p className="text-sm text-muted-foreground">
                      {ui.taskDetailsHelp}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-sm font-medium">{ui.taskTitle}</span>
                    <input
                      className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      value={editTitle}
                      onChange={(event) => {
                        setDetailsError(null);
                        setEditTitle(event.target.value);
                      }}
                      disabled={isSavingTask || isDeletingTask}
                    />
                  </label>

                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-sm font-medium">{ui.description}</span>
                    <textarea
                      className="min-h-24 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      value={editDescription}
                      onChange={(event) => {
                        setDetailsError(null);
                        setEditDescription(event.target.value);
                      }}
                      disabled={isSavingTask || isDeletingTask}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">{ui.planningPriority}</span>
                    <select
                      className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      value={editPriority}
                      onChange={(event) =>
                        setEditPriority(event.target.value as TaskPriority)
                      }
                      disabled={isSavingTask || isDeletingTask}
                    >
                      {priorityOptions.map((priority) => (
                        <option key={priority} value={priority}>
                          {ui.priorityLabels[priority]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col justify-end gap-2">
                    <Button
                      type="button"
                      disabled={isSavingTask || isDeletingTask}
                      onClick={() => void handleSaveTask()}
                    >
                      {isSavingTask ? ui.saving : ui.saveTaskDetails}
                    </Button>
                  </div>
                </div>

                {detailsError ? (
                  <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {detailsError}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
                <p className="text-sm font-medium">{ui.status}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ui.statusHelp}
                </p>
                <div className="mt-4">
                  <StatusBadge value={currentTask.status} />
                </div>
                <select
                  className="mt-4 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={currentTask.status}
                  disabled={isStatusUpdating || currentTask.status === "DONE"}
                  onChange={(event) =>
                    onStatusChange(currentTask.id, event.target.value as TaskStatus)
                  }
                >
                  {statusSelectOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status as TaskStatus]}
                    </option>
                  ))}
                </select>
                {currentTask.status !== "DONE" ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {ui.statusHint}
                  </p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
                <p className="text-sm font-medium">{ui.priority}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ui.priorityHelp}
                </p>
                <div className="mt-4">
                  <PriorityBadge priority={currentTask.priority} />
                </div>
                <select
                  className="mt-4 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={currentTask.priority}
                  disabled={!canEditPriority}
                  onChange={(event) =>
                    onPriorityChange(currentTask.id, event.target.value as TaskPriority)
                  }
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {ui.priorityLabels[priority]}
                    </option>
                  ))}
                </select>
                {!canEditPriority ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {language === "vi"
                      ? "Bạn không có quyền cập nhật priority của task này trong ngữ cảnh hiện tại."
                      : "You do not have permission to update this task priority in the current context."}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-destructive/20 bg-background p-2 text-destructive">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">{ui.dangerZone}</p>
                  <p className="text-sm text-muted-foreground">
                    {ui.dangerZoneHelp}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={isSavingTask || isDeletingTask}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  {isDeletingTask ? ui.deleting : ui.deleteTask}
                </Button>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">{ui.assignees}</h3>
                <p className="text-sm text-muted-foreground">
                  {ui.assigneesHelp}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {currentTask.assignees.length === 0 ? (
                  <Badge variant="outline">{ui.noAssignees}</Badge>
                ) : (
                  currentTask.assignees.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} email={user.email} className="size-8" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {getDisplayName(user, user.email)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        {user.assignmentRole ? (
                          <Badge variant="outline" className="px-2 py-1 text-[11px]">
                            {assignmentRoleLabels[user.assignmentRole]}
                          </Badge>
                        ) : null}
                      </div>

                      {user.assignmentId ? (
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                          <select
                            className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                            value={user.assignmentRole ?? "CONTRIBUTOR"}
                            disabled={isUpdatingAssignment || isRemovingAssignment}
                            onChange={(event) =>
                              onUpdateAssignmentRole(
                                currentTask.id,
                                user.assignmentId!,
                                event.target.value as TaskAssignmentRole
                              )
                            }
                          >
                            {assignmentRoleOptions.map((role) => (
                              <option key={role} value={role}>
                                {assignmentRoleLabels[role]}
                              </option>
                            ))}
                          </select>

                          <Button
                            type="button"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            disabled={isUpdatingAssignment || isRemovingAssignment}
                            onClick={() =>
                              setAssignmentRemovalTarget({
                                assignmentId: user.assignmentId!,
                                userEmail: user.email,
                              })
                            }
                          >
                            {isRemovingAssignment ? ui.removing : ui.remove}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[0.72fr_0.28fr]">
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">{ui.assignUser}</span>
                  <select
                    className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue=""
                    disabled={isUsersLoading || isAssigningUser}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) return;
                      onAssignUser(currentTask.id, value, assignmentRole);
                      event.target.value = "";
                    }}
                  >
                    <option value="">{ui.selectTeammate}</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {getDisplayName(user, user.email)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium">{ui.role}</span>
                  <select
                    className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={assignmentRole}
                    disabled={isAssigningUser}
                    onChange={(event) =>
                      setAssignmentRole(event.target.value as TaskAssignmentRole)
                    }
                  >
                    {assignmentRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {assignmentRoleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {isUsersLoading ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {ui.loadingMembers}
                </p>
              ) : null}
            </section>

            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">{ui.reports}</h3>
                <p className="text-sm text-muted-foreground">
                  {ui.reportsHelp}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <article className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border bg-background p-2">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ui.submitReport}</p>
                      <p className="text-xs text-muted-foreground">
                        {ui.submitReportHelp}
                      </p>
                    </div>
                  </div>

                  {canSubmitReport ? (
                    <div className="mt-4 flex flex-col gap-3">
                      <textarea
                        className="min-h-28 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        value={reportContent}
                        onChange={(event) => {
                          setReportError(null);
                          setReportContent(event.target.value);
                        }}
                        placeholder={
                          language === "vi"
                            ? "Đã hoàn tất tích hợp API, xác minh socket event và ghi chú nghiệm thu để chờ duyệt."
                            : "Completed the work, verified behavior, and summarized key results for review."
                        }
                        disabled={isSubmittingReport}
                      />
                      <div className="rounded-2xl border border-border bg-background p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">{ui.attachments}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ui.attachmentsHelp}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            disabled={isSubmittingReport || uploadReportAttachments.isPending}
                            onClick={() => reportAttachmentInputRef.current?.click()}
                          >
                            <Paperclip className="size-4" />
                            {uploadReportAttachments.isPending ? ui.uploading : ui.uploadFiles}
                          </Button>
                        </div>

                        <input
                          ref={reportAttachmentInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.zip"
                          onChange={(event) =>
                            void handleUploadReportAttachments(event.target.files)
                          }
                        />

                        {reportAttachmentLinks.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {reportAttachmentLinks.map((attachment) => (
                              <div
                                key={attachment.url}
                                className="flex items-center gap-2 rounded-full border border-border bg-secondary/20 px-3 py-2 text-xs"
                              >
                                <a
                                  href={attachment.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="max-w-[16rem] truncate text-foreground hover:underline"
                                >
                                  {attachment.label}
                                </a>
                                <button
                                  type="button"
                                  className="text-muted-foreground transition-colors hover:text-foreground"
                                  onClick={() =>
                                    setUploadedAttachmentUrls((current) =>
                                      current.filter((item) => item !== attachment.url)
                                    )
                                  }
                                  aria-label={`${ui.remove} ${attachment.label}`}
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <textarea
                          className="mt-4 min-h-20 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                          value={reportAttachments}
                          onChange={(event) => setReportAttachments(event.target.value)}
                          placeholder={ui.externalAttachmentPlaceholder}
                          disabled={isSubmittingReport || uploadReportAttachments.isPending}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {ui.attachmentsHint}
                        </p>
                      </div>
                      {uploadError ? (
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          {uploadError}
                        </div>
                      ) : null}
                      {reportError ? (
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          {reportError}
                        </div>
                      ) : null}
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          className="gap-2"
                          disabled={isSubmittingReport}
                          onClick={() => void handleSubmitReport()}
                        >
                          {isSubmittingReport ? ui.submitting : ui.submit}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                      {submitReportHint}
                    </div>
                  )}
                </article>

                <article className="rounded-2xl border border-border bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border bg-background p-2">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ui.leadReview}</p>
                      <p className="text-xs text-muted-foreground">
                        {ui.leadReviewHelp}
                      </p>
                    </div>
                  </div>

                  {canReviewReports ? (
                    <>
                      <textarea
                        className="mt-4 min-h-24 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        value={reviewNotes}
                        onChange={(event) => {
                          setReviewError(null);
                          setReviewNotes(event.target.value);
                        }}
                        placeholder={ui.reviewPlaceholder}
                        disabled={isReviewingReport}
                      />
                      {reviewError ? (
                        <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          {reviewError}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-3">
                        {pendingReports.map((report) => (
                          <div
                            key={report.id}
                            className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-background p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {getDisplayName(report.author, report.author.email)}
                                </p>
                                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                  {formatRelativeDate(report.createdAt)}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {ui.reportStatuses[report.status]}
                              </Badge>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {report.content}
                            </p>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isReviewingReport}
                                onClick={() =>
                                  void handleReviewReport(report.id, "REJECTED")
                                }
                              >
                                {ui.reject}
                              </Button>
                              <Button
                                type="button"
                                disabled={isReviewingReport}
                                onClick={() =>
                                  void handleReviewReport(report.id, "APPROVED")
                                }
                              >
                                {ui.approve}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                      {reviewReportHint}
                    </div>
                  )}
                </article>

                <div className="rounded-2xl border border-border bg-secondary/15 p-4">
                  <div className="flex items-center gap-3">
                    <UserPlus2 className="size-4" />
                    <p className="text-sm font-medium">{ui.reportHistory}</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {isReportsLoading ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                        {ui.loadingReports}
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                        {ui.noReports}
                      </div>
                    ) : (
                      reports.map((report) => (
                        <article
                          key={report.id}
                          className="rounded-2xl border border-border bg-background p-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {getDisplayName(report.author, report.author.email)}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {formatRelativeDate(report.createdAt)}
                              </p>
                            </div>
                            <Badge variant={report.status === "APPROVED" ? "secondary" : "outline"}>
                              {ui.reportStatuses[report.status]}
                            </Badge>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {report.content}
                          </p>
                          {report.attachments.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {report.attachments.map((attachment) => (
                                <a
                                  key={attachment}
                                  href={
                                    attachment.startsWith("/uploads/")
                                      ? `${env.apiUrl}${attachment}`
                                      : attachment
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:bg-secondary/30"
                                >
                                  <Link2 className="size-3.5" />
                                  <span className="max-w-[18rem] truncate">
                                    {attachment.split("/").pop() || attachment}
                                  </span>
                                </a>
                              ))}
                            </div>
                          ) : null}
                          {report.feedback ? (
                            <div className="mt-3 rounded-2xl border border-border bg-secondary/25 px-4 py-3 text-sm text-muted-foreground">
                              {report.feedback}
                            </div>
                          ) : null}
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">{ui.comments}</h3>
                <p className="text-sm text-muted-foreground">
                  {ui.commentsHelp}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-secondary/15 p-4">
                <label className="flex flex-col gap-3">
                  <span className="text-sm font-medium">{ui.addComment}</span>
                  <textarea
                    className="min-h-24 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={commentDraft}
                    onChange={(event) => {
                      setCommentError(null);
                      onCommentDraftChange(currentTask.id, event.target.value);
                    }}
                    placeholder={ui.commentPlaceholder}
                    disabled={isSendingComment}
                  />
                </label>
                {commentError ? (
                  <div className="mt-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {commentError}
                  </div>
                ) : null}
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    className="gap-2"
                    disabled={isSendingComment}
                    onClick={() => void handleSendComment()}
                  >
                    {isSendingComment ? ui.sending : ui.sendComment}
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {ui.mentionHelp}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {isCommentsLoading ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-8 text-center text-sm text-muted-foreground">
                    {ui.commentsLoading}
                  </div>
                ) : task.comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-8 text-center text-sm text-muted-foreground">
                    {ui.noComments}
                  </div>
                ) : (
                  task.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-2xl border border-border bg-secondary/25 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">
                          {getDisplayName(
                            comment.author,
                            language === "vi" ? "Hệ thống" : "System"
                          )}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {formatRelativeDate(comment.createdAt)}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {comment.content}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title={ui.deleteTaskTitle}
        description={
          language === "vi"
            ? `Xóa "${currentTask.title}" khỏi dự án này? Task và toàn bộ hoạt động liên quan sẽ bị xóa vĩnh viễn.`
            : `Delete "${currentTask.title}" from this project? This removes the task and its related activity permanently.`
        }
        confirmLabel={ui.deleteTask}
        tone="danger"
        isPending={isDeletingTask}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          await handleDeleteTask();
          setIsDeleteConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(assignmentRemovalTarget)}
        title={ui.removeAssigneeTitle}
        description={
          language === "vi"
            ? `Gỡ ${assignmentRemovalTarget?.userEmail ?? "thành viên này"} khỏi task hiện tại?`
            : `Remove ${assignmentRemovalTarget?.userEmail ?? "this teammate"} from the current task?`
        }
        confirmLabel={ui.removeAssigneeConfirm}
        tone="danger"
        isPending={isRemovingAssignment}
        onClose={() => setAssignmentRemovalTarget(null)}
        onConfirm={async () => {
          if (!assignmentRemovalTarget) {
            return;
          }

          await handleRemoveAssignment(
            assignmentRemovalTarget.assignmentId,
            assignmentRemovalTarget.userEmail
          );
          setAssignmentRemovalTarget(null);
        }}
      />
    </>
  );
}
