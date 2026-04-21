import { createHash } from 'crypto';
import {
  InvitationStatus,
  NotificationType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedPassword, seedProjects, seedUsers, type MessageSeed } from './seed-data';

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

type SeedUserRecord = Awaited<ReturnType<Prisma.TransactionClient['user']['create']>>;
function ago(
  now: Date,
  input: { days?: number; hours?: number; minutes?: number },
): Date {
  const days = input.days ?? 0;
  const hours = input.hours ?? 0;
  const minutes = input.minutes ?? 0;

  return new Date(
    now.getTime() - days * DAY_MS - hours * HOUR_MS - minutes * MINUTE_MS,
  );
}

function getSeedSaltRounds(): number {
  const configured = Number(process.env.BCRYPT_SALT_ROUNDS ?? '12');
  return Number.isInteger(configured) ? configured : 12;
}

async function hashSeedPassword(): Promise<string> {
  return bcrypt.hash(seedPassword, getSeedSaltRounds());
}

function buildInvitationToken(
  projectKey: string,
  email: string,
  status: InvitationStatus,
): string {
  return createHash('sha256')
    .update(`${projectKey}:${email.toLowerCase()}:${status}`)
    .digest('hex');
}

async function resetDatabase(tx: Prisma.TransactionClient): Promise<void> {
  await tx.notification.deleteMany();
  await tx.taskReport.deleteMany();
  await tx.taskAssignment.deleteMany();
  await tx.message.deleteMany();
  await tx.invitation.deleteMany();
  await tx.projectMember.deleteMany();
  await tx.task.deleteMany();
  await tx.project.deleteMany();
  await tx.user.deleteMany();
}

async function createMessageWithNotifications(
  tx: Prisma.TransactionClient,
  input: {
    projectId: number;
    taskId?: number;
    message: MessageSeed;
    createdAt: Date;
    usersByKey: Map<string, SeedUserRecord>;
  },
) {
  const sender = input.message.senderKey
    ? input.usersByKey.get(input.message.senderKey)
    : null;

  const createdMessage = await tx.message.create({
    data: {
      content: input.message.content,
      senderId: sender?.id ?? null,
      projectId: input.projectId,
      taskId: input.taskId ?? null,
      isSystem: input.message.isSystem ?? false,
      isImportant: input.message.isImportant ?? false,
      isAnnouncement: input.message.isAnnouncement ?? false,
      metadata: input.message.metadata ?? undefined,
      createdAt: input.createdAt,
    },
  });

  if (!input.message.notifications?.length) {
    return createdMessage;
  }

  for (const notification of input.message.notifications) {
    const recipient = input.usersByKey.get(notification.recipientKey);
    if (!recipient) {
      continue;
    }

    const createdAt = new Date(
      input.createdAt.getTime() +
        (notification.createdMinutesAfter ?? 0) * MINUTE_MS,
    );
    const readAt =
      notification.isRead && notification.readMinutesAfter !== undefined
        ? new Date(createdAt.getTime() + notification.readMinutesAfter * MINUTE_MS)
        : notification.isRead
          ? new Date(createdAt.getTime() + 15 * MINUTE_MS)
          : null;

    await tx.notification.create({
      data: {
        recipientId: recipient.id,
        activityId: createdMessage.id,
        type: notification.type,
        isRead: notification.isRead,
        readAt,
        createdAt,
      },
    });
  }

  return createdMessage;
}

async function main() {
  const now = new Date();
  const hashedPassword = await hashSeedPassword();

  await prisma.$transaction(async (tx) => {
    await resetDatabase(tx);

    const usersByKey = new Map<string, SeedUserRecord>();
    const usersByEmail = new Map<string, SeedUserRecord>();

    for (const user of seedUsers) {
      const createdAt = ago(now, { days: user.createdDaysAgo });
      const createdUser = await tx.user.create({
        data: {
          email: user.email.toLowerCase(),
          password: hashedPassword,
          name: user.name,
          role: user.role,
          createdAt,
          updatedAt: new Date(createdAt.getTime() + 2 * HOUR_MS),
        },
      });

      usersByKey.set(user.key, createdUser);
      usersByEmail.set(createdUser.email, createdUser);
    }

    for (const project of seedProjects) {
      const createdAt = ago(now, { days: project.createdDaysAgo });
      const updatedAt = ago(now, { hours: project.updatedHoursAgo });
      const createdProject = await tx.project.create({
        data: {
          name: project.name,
          description: project.description,
          createdAt,
          updatedAt,
        },
      });
      for (const membership of project.memberships) {
        const memberUser = usersByKey.get(membership.userKey);
        if (!memberUser) {
          throw new Error(`Missing user "${membership.userKey}" for membership.`);
        }

        await tx.projectMember.create({
          data: {
            role: membership.role,
            userId: memberUser.id,
            projectId: createdProject.id,
            invitedById: membership.invitedByKey
              ? usersByKey.get(membership.invitedByKey)?.id
              : null,
            joinedAt: ago(now, { days: membership.joinedDaysAgo }),
            leftAt: null,
          },
        });
      }

      for (const invitation of project.invitations) {
        const invitationCreatedAt = ago(now, { days: invitation.createdDaysAgo });
        const recipient = usersByEmail.get(invitation.email.toLowerCase()) ?? null;

        await tx.invitation.create({
          data: {
            email: invitation.email.toLowerCase(),
            token: buildInvitationToken(
              project.key,
              invitation.email,
              invitation.status,
            ),
            status: invitation.status,
            role: invitation.role,
            projectId: createdProject.id,
            senderId: usersByKey.get(invitation.senderKey)!.id,
            expiresAt: new Date(
              invitationCreatedAt.getTime() + invitation.expiresInDays * DAY_MS,
            ),
            createdAt: invitationCreatedAt,
          },
        });

        if (recipient) {
          const invitationVerb =
            invitation.status === InvitationStatus.ACCEPTED
              ? 'accepted access to'
              : invitation.status === InvitationStatus.REJECTED
                ? 'declined the invitation for'
                : invitation.status === InvitationStatus.CANCELED
                  ? 'had the invitation withdrawn for'
                : 'received an invitation to';

          await createMessageWithNotifications(tx, {
            projectId: createdProject.id,
            createdAt: new Date(invitationCreatedAt.getTime() + 5 * MINUTE_MS),
            usersByKey,
            message: {
              createdHoursAgo: 0,
              senderKey: null,
              content: `System invitation update: ${recipient.name ?? recipient.email} ${invitationVerb} ${project.name}.`,
              isSystem: true,
              isAnnouncement: true,
              metadata: {
                kind: 'invitation_activity',
                invitationStatus: invitation.status,
                invitationRole: invitation.role,
                recipientEmail: invitation.email.toLowerCase(),
              },
              notifications: [
                {
                  recipientKey: seedUsers.find(
                    (user) => user.email.toLowerCase() === invitation.email.toLowerCase(),
                  )!.key,
                  type: NotificationType.ANNOUNCEMENT,
                  isRead: invitation.status === InvitationStatus.ACCEPTED,
                  readMinutesAfter:
                    invitation.status === InvitationStatus.ACCEPTED ? 30 : undefined,
                },
              ],
            },
          });
        }
      }

      const sortedProjectMessages = [...project.projectMessages].sort(
        (left, right) => right.createdHoursAgo - left.createdHoursAgo,
      );
      for (const message of sortedProjectMessages) {
        await createMessageWithNotifications(tx, {
          projectId: createdProject.id,
          createdAt: ago(now, { hours: message.createdHoursAgo }),
          message,
          usersByKey,
        });
      }

      for (const task of project.tasks) {
        const taskCreatedAt = ago(now, { days: task.createdDaysAgo });
        const taskUpdatedAt = ago(now, { hours: task.updatedHoursAgo });
        const createdTask = await tx.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            projectId: createdProject.id,
            createdAt: taskCreatedAt,
            updatedAt: taskUpdatedAt,
          },
        });

        for (const assignment of task.assignments) {
          const assignee = usersByKey.get(assignment.userKey);
          if (!assignee) {
            throw new Error(`Missing assignee "${assignment.userKey}".`);
          }

          await tx.taskAssignment.create({
            data: {
              role: assignment.role,
              userId: assignee.id,
              taskId: createdTask.id,
              assignedById: assignment.assignedByKey
                ? usersByKey.get(assignment.assignedByKey)?.id
                : null,
              assignedAt: ago(now, { hours: assignment.assignedHoursAgo }),
            },
          });
        }

        for (const report of task.reports ?? []) {
          const author = usersByKey.get(report.authorKey);
          if (!author) {
            throw new Error(`Missing report author "${report.authorKey}".`);
          }

          const reportCreatedAt = ago(now, { hours: report.createdHoursAgo });
          const createdReport = await tx.taskReport.create({
            data: {
              content: report.content,
              attachments: report.attachments,
              status: report.status,
              feedback: report.feedback ?? null,
              taskId: createdTask.id,
              authorId: author.id,
              createdAt: reportCreatedAt,
              updatedAt:
                report.updatedHoursAgo !== undefined
                  ? ago(now, { hours: report.updatedHoursAgo })
                  : reportCreatedAt,
            },
          });

          await createMessageWithNotifications(tx, {
            projectId: createdProject.id,
            taskId: createdTask.id,
            createdAt: new Date(reportCreatedAt.getTime() + 3 * MINUTE_MS),
            usersByKey,
            message: {
              createdHoursAgo: 0,
              senderKey: null,
              content: `System report update: ${author.name ?? author.email} submitted a ${createdReport.status.toLowerCase()} task report for "${task.title}".`,
              isSystem: true,
              metadata: {
                kind: 'task_report',
                reportStatus: createdReport.status,
              },
            },
          });
        }

        const sortedTaskMessages = [...(task.messages ?? [])].sort(
          (left, right) => right.createdHoursAgo - left.createdHoursAgo,
        );
        for (const message of sortedTaskMessages) {
          await createMessageWithNotifications(tx, {
            projectId: createdProject.id,
            taskId: createdTask.id,
            createdAt: ago(now, { hours: message.createdHoursAgo }),
            message,
            usersByKey,
          });
        }
      }
    }

    const totalUsers = await tx.user.count();
    const totalProjects = await tx.project.count();
    const totalTasks = await tx.task.count();
    const totalMessages = await tx.message.count();
    const totalNotifications = await tx.notification.count();

    console.log(
      [
        'Seed completed successfully.',
        `Users: ${totalUsers}`,
        `Projects: ${totalProjects}`,
        `Tasks: ${totalTasks}`,
        `Messages: ${totalMessages}`,
        `Notifications: ${totalNotifications}`,
        `Demo password: ${seedPassword}`,
      ].join(' '),
    );
  });
}

main()
  .catch((error) => {
    console.error('Seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
