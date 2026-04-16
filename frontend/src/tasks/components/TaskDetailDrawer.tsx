import { useState } from "react";
import { FileText, ShieldCheck, UserPlus2, X } from "lucide-react";

import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { getDisplayName, getDisplayText } from "@/shared/lib/display";
import { formatRelativeDate } from "@/shared/lib/format-date";
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

type TaskDetailDrawerProps = {
  task: TaskItem | null;
  availableUsers: TaskUser[];
  reports: TaskReport[];
  currentUserId?: string | null;
  isCommentsLoading?: boolean;
  isUsersLoading?: boolean;
  isReportsLoading?: boolean;
  isStatusUpdating?: boolean;
  isAssigningUser?: boolean;
  isSendingComment?: boolean;
  isSubmittingReport?: boolean;
  isReviewingReport?: boolean;
  canEditPriority?: boolean;
  open: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onAssignUser: (
    taskId: string,
    userId: string,
    role: TaskAssignmentRole
  ) => void;
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
  currentUserId,
  isCommentsLoading = false,
  isUsersLoading = false,
  isReportsLoading = false,
  isStatusUpdating = false,
  isAssigningUser = false,
  isSendingComment = false,
  isSubmittingReport = false,
  isReviewingReport = false,
  canEditPriority = true,
  open,
  onClose,
  onStatusChange,
  onPriorityChange,
  onAssignUser,
  onSendComment,
  onSubmitReport,
  onReviewReport,
}: TaskDetailDrawerProps) {
  const [assignmentRole, setAssignmentRole] =
    useState<TaskAssignmentRole>("CONTRIBUTOR");
  const [reportContent, setReportContent] = useState("");
  const [reportAttachments, setReportAttachments] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

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

  async function handleSubmitReport() {
    const content = reportContent.trim();
    const attachments = reportAttachments
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (content.length < 10) {
      setReportError("Write a report with at least 10 characters.");
      return;
    }

    setReportError(null);
    await onSubmitReport(currentTask.id, {
      content,
      attachments: attachments.length ? attachments : undefined,
    });
    setReportContent("");
    setReportAttachments("");
  }

  async function handleReviewReport(reportId: string, status: "APPROVED" | "REJECTED") {
    const note = reviewNotes.trim();

    if (status === "REJECTED" && note.length < 10) {
      setReviewError("Add a rejection reason with enough detail for the contributor.");
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
    const content = commentInput.trim();

    if (!content) {
      setCommentError("Write a comment before sending.");
      return;
    }

    setCommentError(null);
    await onSendComment(currentTask.id, content);
    setCommentInput("");
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
              Task detail
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {currentTask.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getDisplayText(currentTask.description, "No description yet.")}
            </p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-6">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
                <p className="text-sm font-medium">Status</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Move the task through the delivery flow.
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
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
                {currentTask.status !== "DONE" ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tasks can move into review here, but final completion must happen
                    through report approval.
                  </p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
                <p className="text-sm font-medium">Priority</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update urgency based on delivery impact.
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
                      {priority}
                    </option>
                  ))}
                </select>
                {!canEditPriority ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Priority updates are not available yet because the backend
                    does not expose an update endpoint for this field.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Assignees</h3>
                <p className="text-sm text-muted-foreground">
                  Assign teammates and set whether they are leading the work or contributing to it.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {currentTask.assignees.length === 0 ? (
                  <Badge variant="outline">No assignees yet</Badge>
                ) : (
                  currentTask.assignees.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-3 py-2"
                    >
                      <Avatar name={user.name} email={user.email} className="size-8" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {getDisplayName(user, user.email)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        {user.assignmentRole ? (
                          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            {user.assignmentRole}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-[0.72fr_0.28fr]">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Assign user</span>
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
                    <option value="">Select teammate</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {getDisplayName(user, user.email)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Role</span>
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
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {isUsersLoading ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Loading project members...
                </p>
              ) : null}
            </section>

            <section className="rounded-3xl border border-border bg-background/95 p-5 shadow-sm">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">Task reports</h3>
                <p className="text-sm text-muted-foreground">
                  Contributors submit delivery evidence here, and task leads review it before the task can be completed.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {canSubmitReport ? (
                  <article className="rounded-2xl border border-border bg-secondary/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-border bg-background p-2">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Submit your report</p>
                        <p className="text-xs text-muted-foreground">
                          Describe what was completed, tested, or ready for review.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <textarea
                        className="min-h-28 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        value={reportContent}
                        onChange={(event) => {
                          setReportError(null);
                          setReportContent(event.target.value);
                        }}
                        placeholder="Completed the API integration, verified socket events, and documented the acceptance notes for review."
                        disabled={isSubmittingReport}
                      />
                      <textarea
                        className="min-h-20 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        value={reportAttachments}
                        onChange={(event) => setReportAttachments(event.target.value)}
                        placeholder="Optional attachment URLs, one per line"
                        disabled={isSubmittingReport}
                      />
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
                          {isSubmittingReport ? "Submitting..." : "Submit report"}
                        </Button>
                      </div>
                    </div>
                  </article>
                ) : null}

                {canReviewReports ? (
                  <article className="rounded-2xl border border-border bg-secondary/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-border bg-background p-2">
                        <ShieldCheck className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Lead review</p>
                        <p className="text-xs text-muted-foreground">
                          Approve when the deliverable is complete, or reject with actionable feedback.
                        </p>
                      </div>
                    </div>

                    <textarea
                      className="mt-4 min-h-24 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      value={reviewNotes}
                      onChange={(event) => {
                        setReviewError(null);
                        setReviewNotes(event.target.value);
                      }}
                      placeholder="Optional approval feedback or required rejection notes"
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
                            <Badge variant="outline">{report.status}</Badge>
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
                              Reject
                            </Button>
                            <Button
                              type="button"
                              disabled={isReviewingReport}
                              onClick={() =>
                                void handleReviewReport(report.id, "APPROVED")
                              }
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}

                <div className="rounded-2xl border border-border bg-secondary/15 p-4">
                  <div className="flex items-center gap-3">
                    <UserPlus2 className="size-4" />
                    <p className="text-sm font-medium">Report history</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {isReportsLoading ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                        Loading task reports...
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                        No reports submitted yet
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
                              {report.status}
                            </Badge>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {report.content}
                          </p>
                          {report.attachments.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {report.attachments.map((attachment) => (
                                <Badge key={attachment} variant="outline" className="max-w-full truncate px-3 py-1">
                                  {attachment}
                                </Badge>
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
                <h3 className="text-lg font-semibold">Comments</h3>
                <p className="text-sm text-muted-foreground">
                  Recent task discussion and system updates from the backend.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-secondary/15 p-4">
                <label className="flex flex-col gap-3">
                  <span className="text-sm font-medium">Add comment</span>
                  <textarea
                    className="min-h-24 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={commentInput}
                    onChange={(event) => {
                      setCommentError(null);
                      setCommentInput(event.target.value);
                    }}
                    placeholder="Share an update, ask a question, or leave implementation notes for the team."
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
                    {isSendingComment ? "Sending..." : "Send comment"}
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {isCommentsLoading ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading comments...
                  </div>
                ) : task.comments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/35 px-4 py-8 text-center text-sm text-muted-foreground">
                    No comments yet
                  </div>
                ) : (
                  task.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-2xl border border-border bg-secondary/25 p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium">
                          {getDisplayName(comment.author, "System")}
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
    </>
  );
}
