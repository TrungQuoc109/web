import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const prisma = {
    notification: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(prisma);
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
