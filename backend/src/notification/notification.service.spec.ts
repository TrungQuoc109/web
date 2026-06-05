import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const prisma = {
    notification: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const eventEmitter = {
    emit: jest.fn(),
  } as unknown as EventEmitter2;

  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(prisma, eventEmitter);
  });

  it('marks all accessible unread notifications as read', async () => {
    prisma.notification.findMany = jest
      .fn()
      .mockResolvedValue([{ id: 10 }, { id: 11 }]);
    prisma.notification.updateMany = jest.fn().mockResolvedValue({ count: 2 });

    const result = await service.markAllAsRead(7);

    expect(result).toEqual({ updatedCount: 2 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [10, 11],
        },
      },
      data: {
        isRead: true,
        readAt: expect.any(Date),
      },
    });
  });
});
