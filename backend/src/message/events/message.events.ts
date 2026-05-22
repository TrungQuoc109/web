import { ProjectRole, TaskPriority, TaskStatus, ReportStatus } from '@prisma/client';

export const MessageEventNames = {
  PROJECT_OWNERSHIP_TRANSFERRED: 'project.ownership.transferred',
  PROJECT_MEMBER_REACTIVATED: 'project.member.reactivated',
  PROJECT_MEMBER_ADDED: 'project.member.added',
  PROJECT_MEMBER_ROLE_CHANGED: 'project.member.role_changed',
  PROJECT_MEMBER_REMOVED: 'project.member.removed',
  INVITATION_ACCEPTED: 'invitation.accepted',
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_STATUS_CHANGED: 'task.status.changed',
  TASK_PRIORITY_CHANGED: 'task.priority.changed',
  TASK_REPORT_SUBMITTED: 'task.report.submitted',
  TASK_REPORT_REVIEWED: 'task.report.reviewed',
};

export class ProjectOwnershipTransferredEvent {
  constructor(
    public readonly projectId: number,
    public readonly previousOwnerId: number,
    public readonly newOwnerId: number,
    public readonly previousOwnerEmail: string,
    public readonly newOwnerEmail: string,
  ) {}
}

export class ProjectMemberReactivatedEvent {
  constructor(
    public readonly projectId: number,
    public readonly memberUserId: number,
    public readonly role: ProjectRole,
    public readonly addedById: number,
    public readonly currentUserEmail: string,
    public readonly targetUserEmail: string,
  ) {}
}

export class ProjectMemberAddedEvent {
  constructor(
    public readonly projectId: number,
    public readonly memberUserId: number,
    public readonly role: ProjectRole,
    public readonly addedById: number,
    public readonly currentUserEmail: string,
    public readonly targetUserEmail: string,
  ) {}
}

export class ProjectMemberRoleChangedEvent {
  constructor(
    public readonly projectId: number,
    public readonly memberUserId: number,
    public readonly previousRole: ProjectRole,
    public readonly nextRole: ProjectRole,
    public readonly changedById: number,
    public readonly currentUserEmail: string,
    public readonly targetUserEmail: string,
  ) {}
}

export class ProjectMemberRemovedEvent {
  constructor(
    public readonly projectId: number,
    public readonly memberUserId: number,
    public readonly previousRole: ProjectRole,
    public readonly removedById: number,
    public readonly currentUserEmail: string,
    public readonly targetUserEmail: string,
  ) {}
}

export class InvitationAcceptedEvent {
  constructor(
    public readonly projectId: number,
    public readonly invitationId: number,
    public readonly userId: number,
    public readonly currentUserEmail: string,
  ) {}
}

export class TaskCreatedEvent {
  constructor(
    public readonly projectId: number,
    public readonly taskId: number,
    public readonly title: string,
    public readonly createdById: number,
    public readonly priority: TaskPriority,
    public readonly currentUserEmail: string,
  ) {}
}

export class TaskAssignedEvent {
  constructor(
    public readonly projectId: number,
    public readonly taskId: number,
    public readonly assignedUserIds: number[],
    public readonly assignedById: number,
    public readonly currentUserEmail: string,
  ) {}
}

export class TaskStatusChangedEvent {
  constructor(
    public readonly projectId: number,
    public readonly taskId: number,
    public readonly status: TaskStatus,
    public readonly changedById: number,
    public readonly currentUserEmail: string,
  ) {}
}

export class TaskPriorityChangedEvent {
  constructor(
    public readonly projectId: number,
    public readonly taskId: number,
    public readonly previousPriority: TaskPriority,
    public readonly priority: TaskPriority,
    public readonly changedById: number,
    public readonly currentUserEmail: string,
  ) {}
}

export class TaskReportSubmittedEvent {
  constructor(
    public readonly projectId: number,
    public readonly taskId: number,
    public readonly reportId: number,
    public readonly authorId: number,
    public readonly currentUserEmail: string,
  ) {}
}

export class TaskReportReviewedEvent {
  constructor(
    public readonly projectId: number,
    public readonly taskId: number,
    public readonly reportId: number,
    public readonly status: ReportStatus,
    public readonly allApproved: boolean,
    public readonly currentUserEmail: string,
  ) {}
}
