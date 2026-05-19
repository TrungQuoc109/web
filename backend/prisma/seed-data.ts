import {
  InvitationStatus,
  NotificationType,
  Prisma,
  ProjectRole,
  ReportStatus,
  Role,
  TaskAssignmentRole,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';

export type UserSeed = {
  key: string;
  name: string;
  email: string;
  role: Role;
  createdDaysAgo: number;
};

export type MembershipSeed = {
  userKey: string;
  role: ProjectRole;
  invitedByKey?: string;
  joinedDaysAgo: number;
};

export type InvitationSeed = {
  email: string;
  status: InvitationStatus;
  role: ProjectRole;
  senderKey: string;
  createdDaysAgo: number;
  expiresInDays: number;
};

export type NotificationSeed = {
  recipientKey: string;
  type: NotificationType;
  isRead: boolean;
  createdMinutesAfter?: number;
  readMinutesAfter?: number;
};

export type MessageSeed = {
  senderKey?: string | null;
  content: string;
  createdHoursAgo: number;
  isSystem?: boolean;
  isImportant?: boolean;
  isAnnouncement?: boolean;
  metadata?: Prisma.InputJsonValue;
  notifications?: NotificationSeed[];
};

export type TaskAssignmentSeed = {
  userKey: string;
  role: TaskAssignmentRole;
  assignedByKey?: string;
  assignedHoursAgo: number;
};

export type TaskReportSeed = {
  authorKey: string;
  content: string;
  attachments: string[];
  status: ReportStatus;
  feedback?: string;
  createdHoursAgo: number;
  updatedHoursAgo?: number;
};

export type TaskSeed = {
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdDaysAgo: number;
  updatedHoursAgo: number;
  assignments: TaskAssignmentSeed[];
  reports?: TaskReportSeed[];
  messages?: MessageSeed[];
};

export type ProjectSeed = {
  key: string;
  name: string;
  description: string;
  createdDaysAgo: number;
  updatedHoursAgo: number;
  memberships: MembershipSeed[];
  invitations: InvitationSeed[];
  projectMessages: MessageSeed[];
  tasks: TaskSeed[];
};

export const seedPassword = 'DemoPass!123';

export const seedUsers: UserSeed[] = [
  {
    key: 'avery',
    name: 'Avery Stone',
    email: 'avery.stone@projecthub.dev',
    role: Role.ADMIN,
    createdDaysAgo: 210,
  },
  {
    key: 'linh',
    name: 'Linh Tran',
    email: 'linh.tran@projecthub.dev',
    role: Role.MANAGER,
    createdDaysAgo: 180,
  },
  {
    key: 'marcus',
    name: 'Marcus Rivera',
    email: 'marcus.rivera@projecthub.dev',
    role: Role.MANAGER,
    createdDaysAgo: 172,
  },
  {
    key: 'noah',
    name: 'Noah Kim',
    email: 'noah.kim@projecthub.dev',
    role: Role.MEMBER,
    createdDaysAgo: 165,
  },
  {
    key: 'priya',
    name: 'Priya Shah',
    email: 'priya.shah@projecthub.dev',
    role: Role.MEMBER,
    createdDaysAgo: 160,
  },
  {
    key: 'sofia',
    name: 'Sofia Alvarez',
    email: 'sofia.alvarez@projecthub.dev',
    role: Role.MEMBER,
    createdDaysAgo: 154,
  },
  {
    key: 'ethan',
    name: 'Ethan Walker',
    email: 'ethan.walker@projecthub.dev',
    role: Role.MEMBER,
    createdDaysAgo: 149,
  },
  {
    key: 'nadia',
    name: 'Nadia Patel',
    email: 'nadia.patel@projecthub.dev',
    role: Role.MEMBER,
    createdDaysAgo: 145,
  },
  {
    key: 'grace',
    name: 'Grace Chen',
    email: 'grace.chen@northstaradvisory.com',
    role: Role.MEMBER,
    createdDaysAgo: 128,
  },
  {
    key: 'daniel',
    name: 'Daniel Brooks',
    email: 'daniel.brooks@lighthousecapital.io',
    role: Role.MEMBER,
    createdDaysAgo: 120,
  },
];

export const seedProjects: ProjectSeed[] = [
  {
    key: 'admin-portal',
    name: 'Internal Admin Portal',
    description:
      'Back-office workspace for finance operations, access approvals, payroll sync monitoring, and audit readiness across internal teams.',
    createdDaysAgo: 120,
    updatedHoursAgo: 3,
    memberships: [
      { userKey: 'linh', role: ProjectRole.OWNER, joinedDaysAgo: 120 },
      {
        userKey: 'avery',
        role: ProjectRole.ADMIN,
        invitedByKey: 'linh',
        joinedDaysAgo: 118,
      },
      {
        userKey: 'noah',
        role: ProjectRole.MEMBER,
        invitedByKey: 'linh',
        joinedDaysAgo: 110,
      },
      {
        userKey: 'ethan',
        role: ProjectRole.MEMBER,
        invitedByKey: 'linh',
        joinedDaysAgo: 104,
      },
      {
        userKey: 'grace',
        role: ProjectRole.VIEWER,
        invitedByKey: 'linh',
        joinedDaysAgo: 65,
      },
    ],
    invitations: [
      {
        email: 'grace.chen@northstaradvisory.com',
        status: InvitationStatus.ACCEPTED,
        role: ProjectRole.VIEWER,
        senderKey: 'linh',
        createdDaysAgo: 67,
        expiresInDays: 7,
      },
      {
        email: 'ops.qa.contractor@vendorflow.io',
        status: InvitationStatus.PENDING,
        role: ProjectRole.MEMBER,
        senderKey: 'linh',
        createdDaysAgo: 2,
        expiresInDays: 5,
      },
    ],
    projectMessages: [
      {
        senderKey: null,
        content:
          'System announcement: finance operations UAT for the payroll sync release is scheduled for next Tuesday at 09:00 ICT.',
        createdHoursAgo: 42,
        isSystem: true,
        isAnnouncement: true,
        isImportant: true,
        metadata: { kind: 'release_window', audience: 'finance-ops' },
        notifications: [
          {
            recipientKey: 'noah',
            type: NotificationType.ANNOUNCEMENT,
            isRead: true,
            readMinutesAfter: 35,
          },
          {
            recipientKey: 'ethan',
            type: NotificationType.ANNOUNCEMENT,
            isRead: false,
          },
        ],
      },
      {
        senderKey: 'linh',
        content:
          'Please keep the payroll retry fix isolated from the RBAC cleanup so the UAT scope stays stable for finance ops.',
        createdHoursAgo: 30,
        metadata: { kind: 'coordination_note' },
      },
      {
        senderKey: 'avery',
        content:
          'Audit requested the export matrix by Thursday, so I am keeping that task on the fastest path.',
        createdHoursAgo: 12,
      },
    ],
    tasks: [
      {
        key: 'admin-sso-timeout',
        title: 'Harden SSO session timeout warning banner',
        description:
          'Make the timeout warning predictable across idle tabs and preserve the redirect target after re-authentication.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 18,
        updatedHoursAgo: 5,
        assignments: [
          {
            userKey: 'noah',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 410,
          },
        ],
      },
      {
        key: 'admin-rbac-export',
        title: 'Export RBAC audit matrix for compliance reviews',
        description:
          'Generate a downloadable role matrix that lists owners, admins, and viewers for each finance-sensitive workspace.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 25,
        updatedHoursAgo: 26,
        assignments: [
          {
            userKey: 'avery',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 560,
          },
        ],
        reports: [
          {
            authorKey: 'avery',
            content:
              'Delivered the CSV export and cross-checked three historical membership snapshots with audit requirements.',
            attachments: ['/artifacts/admin-portal/rbac-matrix-v3.csv'],
            status: ReportStatus.APPROVED,
            feedback:
              'Looks good. The export format is clear enough for the compliance walkthrough.',
            createdHoursAgo: 30,
            updatedHoursAgo: 24,
          },
        ],
      },
      {
        key: 'admin-approval-filters',
        title: 'Replace legacy approval queue filters',
        description:
          'Move the old department and cost-center filters to the new query shape used by finance operations.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 8,
        updatedHoursAgo: 40,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 180,
          },
        ],
      },
      {
        key: 'admin-csv-validation',
        title: 'Fix CSV import validation for inactive departments',
        description:
          'Reject inactive department codes with a clear message instead of silently mapping them to the default queue.',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 12,
        updatedHoursAgo: 9,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 290,
          },
          {
            userKey: 'noah',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'linh',
            assignedHoursAgo: 280,
          },
        ],
        reports: [
          {
            authorKey: 'ethan',
            content:
              'Uploaded the regression notes for inactive department rows and attached the failing CSV samples used during QA.',
            attachments: [
              '/artifacts/admin-portal/inactive-department-regression.xlsx',
            ],
            status: ReportStatus.PENDING,
            createdHoursAgo: 11,
          },
        ],
        messages: [
          {
            senderKey: 'ethan',
            content:
              'Regression notes are attached. The remaining open question is whether we want to highlight inactive cost centers in the preview table.',
            createdHoursAgo: 10,
          },
          {
            senderKey: 'linh',
            content:
              '@Noah please sanity-check the preview copy before I hand this to QA for sign-off.',
            createdHoursAgo: 8,
            metadata: { mentionedUserIds: ['noah'] },
            notifications: [
              {
                recipientKey: 'noah',
                type: NotificationType.MENTION,
                isRead: false,
              },
            ],
          },
        ],
      },
      {
        key: 'admin-timeline-widget',
        title: 'Add admin activity timeline widget',
        description:
          'Show recent approvals, impersonation sessions, and payroll sync retries in a compact activity panel.',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        createdDaysAgo: 6,
        updatedHoursAgo: 38,
        assignments: [],
      },
      {
        key: 'admin-payroll-retry',
        title: 'Resolve payroll sync retry duplication',
        description:
          'Prevent the same payroll retry from being scheduled twice after the ERP connector reconnects.',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.URGENT,
        createdDaysAgo: 9,
        updatedHoursAgo: 4,
        assignments: [
          {
            userKey: 'noah',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 205,
          },
          {
            userKey: 'avery',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'linh',
            assignedHoursAgo: 198,
          },
        ],
        messages: [
          {
            senderKey: 'noah',
            content:
              'Blocked on the ERP sandbox because reconnect events are batched and we cannot reproduce the duplicate retry locally yet.',
            createdHoursAgo: 7,
          },
          {
            senderKey: null,
            content:
              'System update: task status changed to BLOCKED after duplicate retry behavior was observed in the ERP sandbox.',
            createdHoursAgo: 4,
            isSystem: true,
            isImportant: true,
            metadata: { kind: 'status_change', status: 'BLOCKED' },
            notifications: [
              {
                recipientKey: 'linh',
                type: NotificationType.STATUS_CHANGED,
                isRead: true,
                readMinutesAfter: 18,
              },
              {
                recipientKey: 'grace',
                type: NotificationType.STATUS_CHANGED,
                isRead: false,
              },
            ],
          },
        ],
      },
      {
        key: 'admin-impersonation-audit',
        title: 'Backfill impersonation audit events',
        description:
          'Populate missing audit rows for historical impersonation sessions so support actions remain traceable.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 22,
        updatedHoursAgo: 50,
        assignments: [
          {
            userKey: 'avery',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 500,
          },
        ],
      },
      {
        key: 'admin-uat-checklist',
        title: 'Prepare UAT checklist for finance operations',
        description:
          'Document validation steps for approval queues, payroll sync, and export behavior before the finance ops walkthrough.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 5,
        updatedHoursAgo: 3,
        assignments: [
          {
            userKey: 'grace',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 110,
          },
        ],
        messages: [
          {
            senderKey: null,
            content:
              'System assignment: Grace Chen was added as lead reviewer for the UAT checklist.',
            createdHoursAgo: 109,
            isSystem: true,
            metadata: { kind: 'task_assignment' },
            notifications: [
              {
                recipientKey: 'grace',
                type: NotificationType.ASSIGNED,
                isRead: true,
                readMinutesAfter: 22,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'mobile-banking',
    name: 'Mobile Banking App',
    description:
      'Consumer banking mobile app focused on authentication, transfers, card controls, and pilot-bank release readiness.',
    createdDaysAgo: 95,
    updatedHoursAgo: 1,
    memberships: [
      { userKey: 'marcus', role: ProjectRole.OWNER, joinedDaysAgo: 95 },
      {
        userKey: 'priya',
        role: ProjectRole.MEMBER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 90,
      },
      {
        userKey: 'nadia',
        role: ProjectRole.MEMBER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 88,
      },
      {
        userKey: 'sofia',
        role: ProjectRole.MEMBER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 84,
      },
      {
        userKey: 'daniel',
        role: ProjectRole.VIEWER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 52,
      },
    ],
    invitations: [
      {
        email: 'daniel.brooks@lighthousecapital.io',
        status: InvitationStatus.ACCEPTED,
        role: ProjectRole.VIEWER,
        senderKey: 'marcus',
        createdDaysAgo: 55,
        expiresInDays: 7,
      },
      {
        email: 'compliance.lead@pilotbank.co',
        status: InvitationStatus.PENDING,
        role: ProjectRole.ADMIN,
        senderKey: 'marcus',
        createdDaysAgo: 16,
        expiresInDays: -2,
      },
    ],
    projectMessages: [
      {
        senderKey: null,
        content:
          'System announcement: pilot-bank beta scope is frozen for transfers, authentication, and card controls until Friday release review.',
        createdHoursAgo: 34,
        isSystem: true,
        isAnnouncement: true,
        isImportant: true,
        metadata: { kind: 'beta_scope_lock' },
        notifications: [
          {
            recipientKey: 'priya',
            type: NotificationType.ANNOUNCEMENT,
            isRead: true,
            readMinutesAfter: 16,
          },
          {
            recipientKey: 'nadia',
            type: NotificationType.ANNOUNCEMENT,
            isRead: true,
            readMinutesAfter: 25,
          },
          {
            recipientKey: 'sofia',
            type: NotificationType.ANNOUNCEMENT,
            isRead: false,
          },
        ],
      },
      {
        senderKey: 'marcus',
        content:
          'Please keep a close eye on transfer idempotency. The pilot bank is replaying webhook events aggressively in staging.',
        createdHoursAgo: 21,
      },
      {
        senderKey: 'daniel',
        content:
          'Stakeholder note: leadership wants a short update on biometric fallback risk before tomorrow afternoon.',
        createdHoursAgo: 6,
      },
    ],
    tasks: [
      {
        key: 'mobile-biometric-fallback',
        title: 'Implement biometric fallback on Android 14',
        description:
          'Recover gracefully when biometric prompts fail after app resume and keep the secure PIN path accessible.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        createdDaysAgo: 15,
        updatedHoursAgo: 2,
        assignments: [
          {
            userKey: 'priya',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 320,
          },
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'marcus',
            assignedHoursAgo: 316,
          },
        ],
      },
      {
        key: 'mobile-dark-mode-receipt',
        title: 'Review transfer receipt rendering in dark mode',
        description:
          'Fix the clipped header and button contrast issues in the receipt confirmation screen.',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        createdDaysAgo: 11,
        updatedHoursAgo: 36,
        assignments: [
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 260,
          },
        ],
      },
      {
        key: 'mobile-duplicate-transfer',
        title: 'Patch duplicate transfer submission bug',
        description:
          'Prevent the transfer form from resubmitting when the network reconnects after an optimistic confirmation.',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.URGENT,
        createdDaysAgo: 10,
        updatedHoursAgo: 1,
        assignments: [
          {
            userKey: 'priya',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 222,
          },
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'marcus',
            assignedHoursAgo: 220,
          },
        ],
        reports: [
          {
            authorKey: 'priya',
            content:
              'Submitted staging video, network replay logs, and the final retry guard implementation notes for review.',
            attachments: [
              '/artifacts/mobile-banking/duplicate-transfer-fix.mp4',
              '/artifacts/mobile-banking/transfer-replay-logs.json',
            ],
            status: ReportStatus.PENDING,
            createdHoursAgo: 2,
          },
        ],
        messages: [
          {
            senderKey: null,
            content:
              'System assignment: Priya Shah was assigned as lead and Sofia Alvarez as contributor for the duplicate transfer fix.',
            createdHoursAgo: 220,
            isSystem: true,
            metadata: { kind: 'task_assignment' },
            notifications: [
              {
                recipientKey: 'priya',
                type: NotificationType.ASSIGNED,
                isRead: true,
                readMinutesAfter: 14,
              },
              {
                recipientKey: 'sofia',
                type: NotificationType.ASSIGNED,
                isRead: true,
                readMinutesAfter: 19,
              },
            ],
          },
          {
            senderKey: 'marcus',
            content:
              '@Daniel we have a patch in review now. I will share a concise pilot-bank summary once the regression run finishes.',
            createdHoursAgo: 3,
            metadata: { mentionedUserIds: ['daniel'] },
            notifications: [
              {
                recipientKey: 'daniel',
                type: NotificationType.MENTION,
                isRead: false,
              },
            ],
          },
        ],
      },
      {
        key: 'mobile-scheduled-payment-edit',
        title: 'Add scheduled payment edit flow',
        description:
          'Allow customers to modify payee notes and next-run amounts before the payment cutoff window closes.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 6,
        updatedHoursAgo: 44,
        assignments: [
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 130,
          },
        ],
      },
      {
        key: 'mobile-push-token-refresh',
        title: 'Investigate missing push token refresh on iOS',
        description:
          'Track down why devices that restore from backup do not refresh push tokens until the second login.',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 13,
        updatedHoursAgo: 7,
        assignments: [
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 300,
          },
        ],
        messages: [
          {
            senderKey: 'nadia',
            content:
              'Blocked on Apple sandbox devices because restored backups are not consistently reproducing the stale token path.',
            createdHoursAgo: 8,
          },
        ],
      },
      {
        key: 'mobile-card-freeze-events',
        title: 'Build card freeze confirmation events',
        description:
          'Emit analytics and audit events when a user freezes or unfreezes a card from the controls screen.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 7,
        updatedHoursAgo: 5,
        assignments: [
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 150,
          },
        ],
      },
      {
        key: 'mobile-transaction-empty-state',
        title: 'Refine transaction history empty state',
        description:
          'Improve the first-time experience for customers with no posted transactions and add guidance for pending transfers.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 9,
        updatedHoursAgo: 28,
        assignments: [
          {
            userKey: 'priya',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 212,
          },
        ],
      },
      {
        key: 'mobile-beta-checklist',
        title: 'Prepare beta release checklist for pilot bank',
        description:
          'Capture sign-off steps, rollback owners, and support handoff notes for the next beta drop.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 4,
        updatedHoursAgo: 20,
        assignments: [
          {
            userKey: 'daniel',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 90,
          },
        ],
      },
    ],
  },
  {
    key: 'ecommerce-platform',
    name: 'E-commerce Platform',
    description:
      'Multi-merchant commerce platform with checkout reliability, fraud tooling, promotional scheduling, and returns operations.',
    createdDaysAgo: 140,
    updatedHoursAgo: 9,
    memberships: [
      { userKey: 'linh', role: ProjectRole.OWNER, joinedDaysAgo: 140 },
      {
        userKey: 'noah',
        role: ProjectRole.MEMBER,
        invitedByKey: 'linh',
        joinedDaysAgo: 132,
      },
      {
        userKey: 'priya',
        role: ProjectRole.MEMBER,
        invitedByKey: 'linh',
        joinedDaysAgo: 128,
      },
      {
        userKey: 'sofia',
        role: ProjectRole.ADMIN,
        invitedByKey: 'linh',
        joinedDaysAgo: 120,
      },
      {
        userKey: 'grace',
        role: ProjectRole.VIEWER,
        invitedByKey: 'linh',
        joinedDaysAgo: 72,
      },
    ],
    invitations: [
      {
        email: 'marketplace.analyst@retailops.io',
        status: InvitationStatus.REJECTED,
        role: ProjectRole.VIEWER,
        senderKey: 'linh',
        createdDaysAgo: 14,
        expiresInDays: 7,
      },
    ],
    projectMessages: [
      {
        senderKey: null,
        content:
          'System announcement: flash-sale rehearsal starts tomorrow. Inventory sync and checkout rounding must remain stable during the rehearsal window.',
        createdHoursAgo: 29,
        isSystem: true,
        isAnnouncement: true,
        isImportant: true,
        notifications: [
          {
            recipientKey: 'noah',
            type: NotificationType.ANNOUNCEMENT,
            isRead: true,
            readMinutesAfter: 21,
          },
          {
            recipientKey: 'priya',
            type: NotificationType.ANNOUNCEMENT,
            isRead: false,
          },
        ],
      },
      {
        senderKey: 'sofia',
        content:
          'Returns ops asked for the new summary cards before the rehearsal so they can track exceptions without opening Looker.',
        createdHoursAgo: 16,
      },
      {
        senderKey: 'grace',
        content:
          'Stakeholder note: merchandising is more concerned about inventory drift than page-speed polish this week.',
        createdHoursAgo: 7,
      },
    ],
    tasks: [
      {
        key: 'commerce-cache-invalidation',
        title: 'Optimize product detail page cache invalidation',
        description:
          'Invalidate merchant and category slices precisely when pricing or stock changes instead of clearing the entire PDP cache.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 16,
        updatedHoursAgo: 6,
        assignments: [
          {
            userKey: 'noah',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 360,
          },
        ],
      },
      {
        key: 'commerce-tax-rounding',
        title: 'Fix checkout tax rounding for mixed carts',
        description:
          'Align tax rounding between promotions, gift cards, and split-shipment carts before the flash-sale rehearsal.',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.URGENT,
        createdDaysAgo: 12,
        updatedHoursAgo: 3,
        assignments: [
          {
            userKey: 'priya',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 290,
          },
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'linh',
            assignedHoursAgo: 286,
          },
        ],
        reports: [
          {
            authorKey: 'priya',
            content:
              'Attached the mixed-cart regression worksheet, before/after tax traces, and the final checkout snapshots.',
            attachments: [
              '/artifacts/ecommerce/tax-rounding-regression.xlsx',
              '/artifacts/ecommerce/checkout-tax-snapshots.zip',
            ],
            status: ReportStatus.APPROVED,
            feedback:
              'Approved. The edge cases around gift card coverage are now clear and reproducible.',
            createdHoursAgo: 5,
            updatedHoursAgo: 2,
          },
        ],
        messages: [
          {
            senderKey: null,
            content:
              'System update: checkout tax rounding was moved to IN_REVIEW for final QA sign-off.',
            createdHoursAgo: 4,
            isSystem: true,
            metadata: { kind: 'status_change', status: 'IN_REVIEW' },
            notifications: [
              {
                recipientKey: 'linh',
                type: NotificationType.STATUS_CHANGED,
                isRead: true,
                readMinutesAfter: 12,
              },
              {
                recipientKey: 'grace',
                type: NotificationType.STATUS_CHANGED,
                isRead: false,
              },
            ],
          },
        ],
      },
      {
        key: 'commerce-returns-summary',
        title: 'Ship returns dashboard summary cards',
        description:
          'Give operations a compact overview of pending refunds, exchanges, and manual review queues.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 19,
        updatedHoursAgo: 40,
        assignments: [
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 420,
          },
        ],
      },
      {
        key: 'commerce-fraud-filters',
        title: 'Add fraud review queue filters',
        description:
          'Support filtering by payment risk, order value, and merchant tier inside the fraud review queue.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 7,
        updatedHoursAgo: 25,
        assignments: [
          {
            userKey: 'noah',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'sofia',
            assignedHoursAgo: 165,
          },
        ],
      },
      {
        key: 'commerce-inventory-drift',
        title: 'Investigate stale inventory on flash-sale sync',
        description:
          'Identify why the flash-sale feed lags behind warehouse stock updates during burst traffic.',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.URGENT,
        createdDaysAgo: 8,
        updatedHoursAgo: 6,
        assignments: [
          {
            userKey: 'noah',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 185,
          },
          {
            userKey: 'priya',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'linh',
            assignedHoursAgo: 182,
          },
        ],
        messages: [
          {
            senderKey: 'noah',
            content:
              'Warehouse events are landing late in staging because the partner feed is rate-limiting us after every burst test.',
            createdHoursAgo: 7,
          },
        ],
      },
      {
        key: 'commerce-onboarding-checklist',
        title: 'Improve merchant onboarding checklist',
        description:
          'Clarify tax, shipping, and promotional setup steps so new merchants can complete onboarding without support intervention.',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        createdDaysAgo: 5,
        updatedHoursAgo: 30,
        assignments: [
          {
            userKey: 'grace',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'sofia',
            assignedHoursAgo: 120,
          },
        ],
      },
      {
        key: 'commerce-promo-scheduler',
        title: 'Migrate promo banner scheduling job',
        description:
          'Move the promotional banner scheduler to the new worker topology before the seasonal campaign starts.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 20,
        updatedHoursAgo: 60,
        assignments: [
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 470,
          },
        ],
      },
      {
        key: 'commerce-gift-card-qa',
        title: 'QA gift card redemption edge cases',
        description:
          'Cover partial balances, split payments, and returns that include gift-card funded items.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 6,
        updatedHoursAgo: 4,
        assignments: [
          {
            userKey: 'priya',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'sofia',
            assignedHoursAgo: 138,
          },
          {
            userKey: 'grace',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'sofia',
            assignedHoursAgo: 135,
          },
        ],
      },
    ],
  },
  {
    key: 'ai-content',
    name: 'AI Content Automation',
    description:
      'AI-assisted content pipeline for summarization, prompt governance, content approvals, and outbound delivery telemetry.',
    createdDaysAgo: 80,
    updatedHoursAgo: 2,
    memberships: [
      { userKey: 'marcus', role: ProjectRole.OWNER, joinedDaysAgo: 80 },
      {
        userKey: 'ethan',
        role: ProjectRole.MEMBER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 76,
      },
      {
        userKey: 'nadia',
        role: ProjectRole.MEMBER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 74,
      },
      {
        userKey: 'sofia',
        role: ProjectRole.MEMBER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 70,
      },
      {
        userKey: 'daniel',
        role: ProjectRole.VIEWER,
        invitedByKey: 'marcus',
        joinedDaysAgo: 34,
      },
    ],
    invitations: [
      {
        email: 'customer.success@draftforge.ai',
        status: InvitationStatus.PENDING,
        role: ProjectRole.VIEWER,
        senderKey: 'marcus',
        createdDaysAgo: 1,
        expiresInDays: 6,
      },
      {
        email: 'marketing.ops@draftforge.ai',
        status: InvitationStatus.CANCELED,
        role: ProjectRole.MEMBER,
        senderKey: 'marcus',
        createdDaysAgo: 9,
        expiresInDays: 7,
      },
    ],
    projectMessages: [
      {
        senderKey: null,
        content:
          'System announcement: pilot customers can now use prompt version history in staging, but content export remains limited to internal accounts.',
        createdHoursAgo: 26,
        isSystem: true,
        isAnnouncement: true,
        isImportant: true,
        notifications: [
          {
            recipientKey: 'ethan',
            type: NotificationType.ANNOUNCEMENT,
            isRead: true,
            readMinutesAfter: 18,
          },
          {
            recipientKey: 'nadia',
            type: NotificationType.ANNOUNCEMENT,
            isRead: false,
          },
        ],
      },
      {
        senderKey: 'marcus',
        content:
          'Please treat latency regressions on long PDFs as launch blockers. The pilot customer samples are larger than our internal fixtures.',
        createdHoursAgo: 15,
      },
      {
        senderKey: 'daniel',
        content:
          'Customer-side note: content leads are excited about version history, but they still want clearer approval labels before rollout.',
        createdHoursAgo: 5,
      },
    ],
    tasks: [
      {
        key: 'ai-version-history',
        title: 'Add prompt template version history',
        description:
          'Expose historical prompt versions, diffs, and rollback actions so content teams can compare prompt changes safely.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 14,
        updatedHoursAgo: 4,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 310,
          },
        ],
      },
      {
        key: 'ai-guardrail-review',
        title: 'Review tone safety guardrail prompts',
        description:
          'Tighten the tone rules used for customer-facing summaries without increasing false positives on neutral business copy.',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 10,
        updatedHoursAgo: 6,
        assignments: [
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 225,
          },
          {
            userKey: 'daniel',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'marcus',
            assignedHoursAgo: 220,
          },
        ],
        reports: [
          {
            authorKey: 'sofia',
            content:
              'Submitted prompt diff screenshots and comparison runs against the last three customer safety incidents.',
            attachments: [
              '/artifacts/ai-content/guardrail-prompt-diff.png',
              '/artifacts/ai-content/tone-safety-comparison.csv',
            ],
            status: ReportStatus.REJECTED,
            feedback:
              'Need one more pass. The current prompt still over-flags neutral legal summaries.',
            createdHoursAgo: 9,
            updatedHoursAgo: 5,
          },
        ],
        messages: [
          {
            senderKey: 'marcus',
            content:
              '@Sofia please include the legal-summary samples in the next report so product can decide whether the false positives are acceptable.',
            createdHoursAgo: 5,
            metadata: { mentionedUserIds: ['sofia'] },
            notifications: [
              {
                recipientKey: 'sofia',
                type: NotificationType.MENTION,
                isRead: false,
              },
            ],
          },
        ],
      },
      {
        key: 'ai-usage-widget',
        title: 'Build workspace quota usage widget',
        description:
          'Show remaining generation quota and overage warnings at the workspace level.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 7,
        updatedHoursAgo: 36,
        assignments: [
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 160,
          },
        ],
      },
      {
        key: 'ai-pdf-latency',
        title: 'Investigate slow summary generation on long PDFs',
        description:
          'Profile model latency, chunking, and retry behavior for long-form PDF uploads from pilot customers.',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.URGENT,
        createdDaysAgo: 9,
        updatedHoursAgo: 2,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 200,
          },
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'marcus',
            assignedHoursAgo: 196,
          },
        ],
        messages: [
          {
            senderKey: 'ethan',
            content:
              'Blocked on vendor-side throughput limits. We can reproduce the latency spike, but the provider rate caps make the traces noisy.',
            createdHoursAgo: 3,
          },
          {
            senderKey: null,
            content:
              'System update: task status changed to BLOCKED after vendor throughput limits prevented consistent profiling results.',
            createdHoursAgo: 2,
            isSystem: true,
            metadata: { kind: 'status_change', status: 'BLOCKED' },
            notifications: [
              {
                recipientKey: 'marcus',
                type: NotificationType.STATUS_CHANGED,
                isRead: true,
                readMinutesAfter: 10,
              },
              {
                recipientKey: 'daniel',
                type: NotificationType.STATUS_CHANGED,
                isRead: false,
              },
            ],
          },
        ],
      },
      {
        key: 'ai-approval-labels',
        title: 'Ship content approval queue labels',
        description:
          'Add clear status labels for draft, legal review, and customer approval inside the approval queue.',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        createdDaysAgo: 12,
        updatedHoursAgo: 48,
        assignments: [
          {
            userKey: 'sofia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 265,
          },
        ],
      },
      {
        key: 'ai-slack-telemetry',
        title: 'Add Slack delivery retry telemetry',
        description:
          'Track Slack webhook retries so support can see why outbound delivery failed for scheduled digests.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 5,
        updatedHoursAgo: 28,
        assignments: [
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 115,
          },
        ],
      },
      {
        key: 'ai-crawl-dedup',
        title: 'Harden web crawl deduplication rules',
        description:
          'Reduce duplicate source ingestion when the same article appears under campaign and category URLs.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 11,
        updatedHoursAgo: 7,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 250,
          },
        ],
      },
      {
        key: 'ai-pilot-enable',
        title: 'Prepare customer pilot enablement notes',
        description:
          'Document rollout expectations, known limitations, and escalation contacts for the first customer pilot wave.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 6,
        updatedHoursAgo: 26,
        assignments: [
          {
            userKey: 'daniel',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'marcus',
            assignedHoursAgo: 140,
          },
        ],
      },
    ],
  },
  {
    key: 'crm-analytics',
    name: 'CRM Analytics Platform',
    description:
      'Sales operations and analytics workspace for cohort reporting, pipeline health, revenue forecasting, and partner exports.',
    createdDaysAgo: 60,
    updatedHoursAgo: 8,
    memberships: [
      { userKey: 'linh', role: ProjectRole.OWNER, joinedDaysAgo: 60 },
      {
        userKey: 'nadia',
        role: ProjectRole.MEMBER,
        invitedByKey: 'linh',
        joinedDaysAgo: 58,
      },
      {
        userKey: 'ethan',
        role: ProjectRole.MEMBER,
        invitedByKey: 'linh',
        joinedDaysAgo: 54,
      },
      {
        userKey: 'priya',
        role: ProjectRole.MEMBER,
        invitedByKey: 'linh',
        joinedDaysAgo: 50,
      },
      {
        userKey: 'daniel',
        role: ProjectRole.VIEWER,
        invitedByKey: 'linh',
        joinedDaysAgo: 28,
      },
    ],
    invitations: [
      {
        email: 'data.engineer.contractor@insightgrid.io',
        status: InvitationStatus.PENDING,
        role: ProjectRole.MEMBER,
        senderKey: 'linh',
        createdDaysAgo: 3,
        expiresInDays: 4,
      },
    ],
    projectMessages: [
      {
        senderKey: null,
        content:
          'System announcement: sales ops pilot starts Monday, and export permissions must be locked before partner accounts are onboarded.',
        createdHoursAgo: 32,
        isSystem: true,
        isAnnouncement: true,
        isImportant: true,
        notifications: [
          {
            recipientKey: 'nadia',
            type: NotificationType.ANNOUNCEMENT,
            isRead: false,
          },
          {
            recipientKey: 'ethan',
            type: NotificationType.ANNOUNCEMENT,
            isRead: true,
            readMinutesAfter: 28,
          },
        ],
      },
      {
        senderKey: 'linh',
        content:
          'Forecast accuracy matters less than trustworthy filters for the pilot. Please bias toward clarity and auditability.',
        createdHoursAgo: 18,
      },
      {
        senderKey: 'daniel',
        content:
          'Stakeholder note: partner success wants the export permission review closed before they commit the onboarding date.',
        createdHoursAgo: 9,
      },
    ],
    tasks: [
      {
        key: 'crm-retention-filters',
        title: 'Define cohort retention filter presets',
        description:
          'Preconfigure retention views for monthly, quarterly, and enterprise segments so sales ops can compare cohorts quickly.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 8,
        updatedHoursAgo: 33,
        assignments: [
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 180,
          },
        ],
      },
      {
        key: 'crm-pipeline-health',
        title: 'Implement pipeline health snapshot card',
        description:
          'Show at-risk deals, stalled stages, and near-term coverage gaps on the dashboard landing view.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 14,
        updatedHoursAgo: 6,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 320,
          },
        ],
      },
      {
        key: 'crm-export-permissions',
        title: 'Review export permissions for partner accounts',
        description:
          'Lock down exports so partner users only see the account slices they are explicitly mapped to.',
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 11,
        updatedHoursAgo: 8,
        assignments: [
          {
            userKey: 'priya',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 250,
          },
          {
            userKey: 'daniel',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'linh',
            assignedHoursAgo: 246,
          },
        ],
        reports: [
          {
            authorKey: 'priya',
            content:
              'Uploaded the export permission matrix and partner-account role walkthrough for final review.',
            attachments: [
              '/artifacts/crm-analytics/export-permission-matrix.csv',
            ],
            status: ReportStatus.PENDING,
            createdHoursAgo: 9,
          },
        ],
      },
      {
        key: 'crm-stage-audit',
        title: 'Backfill stage transition audit events',
        description:
          'Recreate missing audit events for older opportunities so the pilot team can trust historical movement reports.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 18,
        updatedHoursAgo: 50,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 430,
          },
        ],
      },
      {
        key: 'crm-timezone-mismatch',
        title: 'Fix dashboard timezone mismatch in APAC accounts',
        description:
          'Align opportunity close-date aggregations with account-level timezones so APAC teams stop seeing revenue in the wrong week.',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.HIGH,
        createdDaysAgo: 9,
        updatedHoursAgo: 7,
        assignments: [
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 205,
          },
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'linh',
            assignedHoursAgo: 202,
          },
        ],
        messages: [
          {
            senderKey: 'nadia',
            content:
              'Blocked until the customer success team sends corrected APAC account timezone mappings for the pilot cohort.',
            createdHoursAgo: 8,
          },
        ],
      },
      {
        key: 'crm-forecast-empty-state',
        title: 'Add revenue forecast empty states',
        description:
          'Clarify what sales ops should do when a team has no forecast data or has not mapped its pipeline stages yet.',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        createdDaysAgo: 5,
        updatedHoursAgo: 24,
        assignments: [
          {
            userKey: 'daniel',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 110,
          },
        ],
      },
      {
        key: 'crm-onboarding-checklist',
        title: 'Prepare onboarding checklist for sales ops pilot',
        description:
          'Write the pilot setup checklist, data import checkpoints, and escalation paths for sales ops admins.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 4,
        updatedHoursAgo: 22,
        assignments: [
          {
            userKey: 'daniel',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 90,
          },
        ],
      },
      {
        key: 'crm-query-indexes',
        title: 'Tune account activity query indexes',
        description:
          'Reduce dashboard load time for account activity and cohort comparison screens by tightening the hot path indexes.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        createdDaysAgo: 10,
        updatedHoursAgo: 2,
        assignments: [
          {
            userKey: 'ethan',
            role: TaskAssignmentRole.LEAD,
            assignedByKey: 'linh',
            assignedHoursAgo: 210,
          },
          {
            userKey: 'nadia',
            role: TaskAssignmentRole.CONTRIBUTOR,
            assignedByKey: 'linh',
            assignedHoursAgo: 208,
          },
        ],
        messages: [
          {
            senderKey: null,
            content:
              'System assignment: Ethan Walker was assigned as lead and Nadia Patel as contributor for the query index tuning work.',
            createdHoursAgo: 208,
            isSystem: true,
            metadata: { kind: 'task_assignment' },
            notifications: [
              {
                recipientKey: 'ethan',
                type: NotificationType.ASSIGNED,
                isRead: true,
                readMinutesAfter: 11,
              },
              {
                recipientKey: 'nadia',
                type: NotificationType.ASSIGNED,
                isRead: false,
              },
            ],
          },
        ],
      },
    ],
  },
];
