import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNotificationsInput,
  NotificationView,
} from './notification.types';
import { notificationSelect } from './notification.constants';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: number, limit = 12): Promise<NotificationView[]> {
    return this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        activity: {
          project: {
            members: {
              some: {
                userId,
                leftAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: notificationSelect,
    });
  }

  async createNotifications(
    input: CreateNotificationsInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const recipientIds = [...new Set(input.recipientIds)];

    if (recipientIds.length === 0) {
      return;
    }

    const client = tx ?? this.prisma;

    await client.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        recipientId,
        activityId: input.activityId,
        type: input.type,
      })),
      skipDuplicates: true,
    });
  }

  async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<NotificationView> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      select: notificationSelect,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    await this.ensureCanAccessActivityTarget(
      userId,
      notification.activity.projectId,
    );

    return this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      select: notificationSelect,
    });
  }

  async markAllAsRead(userId: number): Promise<{ updatedCount: number }> {
    const accessibleNotificationIds = await this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        isRead: false,
        activity: {
          project: {
            members: {
              some: {
                userId,
                leftAt: null,
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (accessibleNotificationIds.length === 0) {
      return { updatedCount: 0 };
    }

    const result = await this.prisma.notification.updateMany({
      where: {
        id: {
          in: accessibleNotificationIds.map((notification) => notification.id),
        },
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async getUnreadCount(userId: number): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
        activity: {
          project: {
            members: {
              some: {
                userId,
                leftAt: null,
              },
            },
          },
        },
      },
    });

    return { unreadCount };
  }

  private async ensureCanAccessActivityTarget(
    userId: number,
    projectId: number,
  ): Promise<void> {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      select: {
        id: true,
        leftAt: true,
      },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException(
        'You no longer have permission to access this notification target.',
      );
    }
  }
}
