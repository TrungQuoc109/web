import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectRole } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { ProjectPermissionService } from './project-permission.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { projectMemberSelect } from './project.constants';
import { InvitationView, ProjectMemberView } from './project.types';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { MessageEventNames, InvitationAcceptedEvent } from '../message/events/message.events';

@Injectable()
export class InvitationService {
  private readonly inviteExpiryDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: ProjectPermissionService,
    private readonly eventEmitter: EventEmitter2,
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
  ): Promise<InvitationView> {
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

    const rawToken = randomUUID();
    const tokenHash = this.hashToken(rawToken);

    const created = await this.prisma.invitation.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        tokenPreview: rawToken.slice(-6),
        role: targetRole,
        projectId,
        senderId: currentUser.id,
        expiresAt: this.computeExpiry(),
      },
      select: {
        id: true,
        email: true,
        tokenPreview: true,
        status: true,
        role: true,
        projectId: true,
        senderId: true,
        expiresAt: true,
        createdAt: true,
        sentAt: true,
      },
    });

    return {
      ...created,
      token: rawToken,
    };
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
      orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        email: true,
        tokenPreview: true,
        status: true,
        role: true,
        projectId: true,
        senderId: true,
        expiresAt: true,
        createdAt: true,
        sentAt: true,
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

    const rawToken = randomUUID();
    const tokenHash = this.hashToken(rawToken);

    const updated = await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        tokenHash,
        tokenPreview: rawToken.slice(-6),
        status: 'PENDING',
        senderId: currentUser.id,
        expiresAt: this.computeExpiry(),
        sentAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        tokenPreview: true,
        status: true,
        role: true,
        projectId: true,
        senderId: true,
        expiresAt: true,
        createdAt: true,
        sentAt: true,
      },
    });

    return {
      ...updated,
      token: rawToken,
    };
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
        tokenPreview: true,
        status: true,
        role: true,
        projectId: true,
        senderId: true,
        expiresAt: true,
        createdAt: true,
        sentAt: true,
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

    const memberRecord = await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      const record = membership
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

      return record;
    });

    this.eventEmitter.emit(
      MessageEventNames.INVITATION_ACCEPTED,
      new InvitationAcceptedEvent(
        invitation.projectId,
        invitation.id,
        currentUser.id,
        currentUser.email,
      ),
    );

    return memberRecord;
  }

  private async fetchPendingInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
