export type Role = "ADMIN" | "MANAGER" | "MEMBER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "BLOCKED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskAssignmentRole = "LEAD" | "CONTRIBUTOR";

export type ReportStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ProjectStatus = "ACTIVE" | "PLANNING" | "AT_RISK" | "COMPLETED";

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type NotificationType =
  | "MENTION"
  | "ASSIGNED"
  | "STATUS_CHANGED"
  | "ANNOUNCEMENT";

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELED";
