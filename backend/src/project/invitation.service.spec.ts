import { ConfigService } from '@nestjs/config';
import { InvitationStatus, NotificationType, ProjectRole } from '@prisma/client';
import { MessageService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvitationService } from './invitation.service';
import { ProjectPermissionService } from './project-permission.service';

describe('InvitationService', () => {
  const prisma = {
    invitation: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const permission = {
    ensureNotActiveMember: jest.fn(),
  } as unknown as ProjectPermissionService;
  const messageService = {
    createSystemMessage: jest.fn(),
  } as unknown as MessageService;
  const notificationService = {
    createNotifications: jest.fn(),
  } as unknown as NotificationService;
  const configService = {
    get: jest.fn().mockReturnValue('7'),
  } as unknown as ConfigService;

  let service: InvitationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvitationService(
      prisma,
      permission,
      messageService,
      notificationService,
      configService,
    );
  });

  it('accepts an invitation and restores membership with the invited role', async () => {
    const currentUser = {
      id: 7,
      email: 'grace.chen@northstaradvisory.com',
      name: 'Grace Chen',
      role: 'MEMBER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const tx = {
      invitation: {
        update: jest.fn(),
      },
      projectMember: {
        update: jest.fn().mockResolvedValue({
          id: 51,
          role: ProjectRole.VIEWER,
          joinedAt: new Date(),
          user: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            role: currentUser.role,
          },
        }),
        findMany: jest.fn().mockResolvedValue([{ userId: 3 }, { userId: 4 }]),
      },
    };

    prisma.invitation.findUnique = jest.fn().mockResolvedValue({
      id: 19,
      email: currentUser.email,
      status: InvitationStatus.PENDING,
      role: ProjectRole.VIEWER,
      projectId: 12,
      expiresAt: new Date(Date.now() + 60_000),
    });
    (permission.ensureNotActiveMember as jest.Mock).mockResolvedValue({
      id: 51,
    });
    (messageService.createSystemMessage as jest.Mock).mockResolvedValue({
      id: 88,
    });
    (notificationService.createNotifications as jest.Mock).mockResolvedValue(
      undefined,
    );
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback(tx),
    );

    const result = await service.acceptInvitation('invite-token', currentUser);

    expect(result.role).toBe(ProjectRole.VIEWER);
    expect(tx.projectMember.update).toHaveBeenCalledWith({
      where: { id: 51 },
      data: {
        leftAt: null,
        role: ProjectRole.VIEWER,
      },
      select: expect.anything(),
    });
    expect(messageService.createSystemMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 12,
        metadata: expect.objectContaining({
          type: 'INVITATION_ACCEPTED',
          invitationId: 19,
          userId: currentUser.id,
        }),
      }),
      tx,
    );
    expect(notificationService.createNotifications).toHaveBeenCalledWith(
      {
        activityId: 88,
        type: NotificationType.ANNOUNCEMENT,
        recipientIds: [3, 4],
      },
      tx,
    );
  });
});
