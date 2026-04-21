import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Invitation, NotificationType, ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { ProjectPermissionService } from './project-permission.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { projectMemberSelect } from './project.constants';
import { InvitationView, ProjectMemberView } from './project.types';
import { randomUUID } from 'crypto';

@Injectable()
export class InvitationService {
  private readonly inviteExpiryDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
    private readonly messageService: MessageService,
    private readonly notificationService: NotificationService,
    configService: ConfigService,
  ) {
    const parsed = Number(
      configService.get<string>('INVITATION_EXPIRY_DAYS') ?? '7',
    );
    this.inviteExpiryDays = Number.isInteger(parsed) ? parsed : 7;
  }

  async createInvitation(
    projectId: number,
    currentUser: AuthenticatedUser,
    dto: CreateInvitationDto,
  ): Promise<Invitation> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);
    const targetRole = dto.role ?? ProjectRole.MEMBER;

    if (targetRole === ProjectRole.OWNER) {
      throw new ConflictException(
        'Project ownership cannot be granted through invitations.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      const membership = await this.prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: existing.id,
            projectId,
          },
        },
      });

      if (membership && membership.leftAt === null) {
        throw new ConflictException('User is already a project member.');
      }
    }

    const existingPendingInvitation = await this.prisma.invitation.findFirst({
      where: {
        projectId,
        email: normalizedEmail,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (existingPendingInvitation) {
      throw new ConflictException(
        'An active invitation already exists for this email address.',
      );
    }

    return this.prisma.invitation.create({
      data: {
        email: normalizedEmail,
        token: randomUUID(),
        role: targetRole,
        projectId,
        senderId: currentUser.id,
        expiresAt: this.computeExpiry(),
      },
    });
  }

  async listInvitations(
    projectId: number,
    currentUser: AuthenticatedUser,
  ): Promise<InvitationView[]> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);

    return this.prisma.invitation.findMany({
      where: {
        projectId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        email: true,
        token: true,
        status: true,
        role: true,
        projectId: true,
        senderId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async resendInvitation(
    projectId: number,
    invitationId: number,
    currentUser: AuthenticatedUser,
  ): Promise<InvitationView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);
    const invitation = await this.ensureProjectInvitation(projectId, invitationId);

    if (invitation.status === 'ACCEPTED') {
      throw new ConflictException(
        'Accepted invitations cannot be resent because the user already joined the project.',
      );
    }

    return this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        token: randomUUID(),
        status: 'PENDING',
        senderId: currentUser.id,
        expiresAt: this.computeExpiry(),
        createdAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        token: true,
        status: true,
        role: true,
        projectId: true,
        senderId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async cancelInvitation(
    projectId: number,
    invitationId: number,
    currentUser: AuthenticatedUser,
  ): Promise<InvitationView> {
    await this.permission.ensureCanManageMembers(projectId, currentUser.id);
    const invitation = await this.ensureProjectInvitation(projectId, invitationId);

    if (invitation.status !== 'PENDING') {
      throw new ConflictException('Only pending invitations can be canceled.');
    }

    return this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'CANCELED',
      },
      select: {
        id: true,
        email: true,
        token: true,
        status: true,
        role: true,
        projectId: true,
        senderId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async acceptInvitation(
    token: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMemberView> {
    const invitation = await this.fetchPendingInvitation(token);

    if (invitation.email !== currentUser.email.toLowerCase()) {
      throw new ForbiddenException(
        'Invitation email does not match authenticated user.',
      );
    }

    const membership = await this.permission.ensureNotActiveMember(
      invitation.projectId,
      currentUser.id,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      const memberRecord = membership
        ? await tx.projectMember.update({
            where: { id: membership.id },
            data: {
              leftAt: null,
              role: invitation.role,
            },
            select: projectMemberSelect,
          })
        : await tx.projectMember.create({
            data: {
              projectId: invitation.projectId,
              userId: currentUser.id,
              role: invitation.role,
            },
            select: projectMemberSelect,
          });

      const activity = await this.messageService.createSystemMessage(
        {
          projectId: invitation.projectId,
          content: `${currentUser.email} has joined the project.`,
          metadata: {
            type: 'INVITATION_ACCEPTED',
            invitationId: invitation.id,
            userId: currentUser.id,
          },
        },
        tx,
      );

      const recipients = await tx.projectMember.findMany({
        where: {
          projectId: invitation.projectId,
          leftAt: null,
          userId: {
            not: currentUser.id,
          },
        },
        select: {
          userId: true,
        },
      });

      await this.notificationService.createNotifications(
        {
          activityId: activity.id,
          type: NotificationType.ANNOUNCEMENT,
          recipientIds: recipients.map((recipient) => recipient.userId),
        },
        tx,
      );

      return memberRecord;
    });
  }

  private async fetchPendingInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    if (invitation.status !== 'PENDING') {
      throw new ConflictException('Invitation is no longer pending.');
    }

    if (invitation.expiresAt < new Date()) {
      throw new ForbiddenException('Invitation has expired.');
    }

    return invitation;
  }

  private async ensureProjectInvitation(projectId: number, invitationId: number) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.projectId !== projectId) {
      throw new NotFoundException('Invitation not found.');
    }

    return invitation;
  }

  private computeExpiry(): Date {
    const now = new Date();
    now.setDate(now.getDate() + this.inviteExpiryDays);
    return now;
  }
}
