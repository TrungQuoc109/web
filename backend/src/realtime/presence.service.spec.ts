import { PresenceService } from './presence.service';
import { RedisService } from '../redis/redis.service';

describe('PresenceService', () => {
  const redisServiceMock = {
    sadd: jest.fn(),
    srem: jest.fn(),
    scard: jest.fn(),
    del: jest.fn(),
    smembers: jest.fn(),
    expire: jest.fn(),
    zremrangebyscore: jest.fn(),
    zadd: jest.fn(),
    zrem: jest.fn(),
    zrange: jest.fn(),
  } as any;

  let service: PresenceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PresenceService(redisServiceMock);
  });

  describe('Project Online Presence (RT-01)', () => {
    it('registers user socket presence in Redis', async () => {
      redisServiceMock.sadd.mockResolvedValue(1);
      redisServiceMock.expire.mockResolvedValue(1);

      await service.registerProjectPresence(10, 5, 'socket-abc');

      expect(redisServiceMock.sadd).toHaveBeenNthCalledWith(1, 'project:10:presence:5', 'socket-abc');
      expect(redisServiceMock.sadd).toHaveBeenNthCalledWith(2, 'project:10:presence', '5');
      expect(redisServiceMock.expire).toHaveBeenNthCalledWith(1, 'project:10:presence:5', 86400);
      expect(redisServiceMock.expire).toHaveBeenNthCalledWith(2, 'project:10:presence', 86400);
    });

    it('unregisters socket presence and removes user from online set when no sockets remain', async () => {
      redisServiceMock.srem.mockResolvedValue(1);
      redisServiceMock.scard.mockResolvedValue(0);
      redisServiceMock.del.mockResolvedValue(1);

      await service.unregisterProjectPresence(10, 5, 'socket-abc');

      expect(redisServiceMock.srem).toHaveBeenNthCalledWith(1, 'project:10:presence:5', 'socket-abc');
      expect(redisServiceMock.scard).toHaveBeenCalledWith('project:10:presence:5');
      expect(redisServiceMock.srem).toHaveBeenNthCalledWith(2, 'project:10:presence', '5');
      expect(redisServiceMock.del).toHaveBeenCalledWith('project:10:presence:5');
    });

    it('unregisters socket presence but does not remove user if other sockets are active', async () => {
      redisServiceMock.srem.mockResolvedValue(1);
      redisServiceMock.scard.mockResolvedValue(1); // 1 active connection left

      await service.unregisterProjectPresence(10, 5, 'socket-abc');

      expect(redisServiceMock.srem).toHaveBeenCalledTimes(1);
      expect(redisServiceMock.srem).toHaveBeenCalledWith('project:10:presence:5', 'socket-abc');
      expect(redisServiceMock.scard).toHaveBeenCalledWith('project:10:presence:5');
      // Should NOT delete or remove user from online list
      expect(redisServiceMock.srem).not.toHaveBeenCalledWith('project:10:presence', '5');
      expect(redisServiceMock.del).not.toHaveBeenCalled();
    });

    it('retrieves project online user IDs', async () => {
      redisServiceMock.smembers.mockResolvedValue(['5', '9', 'invalid', '12']);

      const onlineIds = await service.getProjectOnlineUserIds(10);

      expect(redisServiceMock.smembers).toHaveBeenCalledWith('project:10:presence');
      expect(onlineIds).toEqual([5, 9, 12]);
    });
  });

  describe('Project Typing Status (RT-02)', () => {
    it('registers user typing status as Sorted Set with absolute expiration score', async () => {
      redisServiceMock.zremrangebyscore.mockResolvedValue(0);
      redisServiceMock.zadd.mockResolvedValue(1);
      redisServiceMock.expire.mockResolvedValue(1);

      const baseTime = 1600000000000;
      jest.spyOn(Date, 'now').mockReturnValue(baseTime);

      await service.registerProjectTyping(10, 5, 10000);

      expect(redisServiceMock.zremrangebyscore).toHaveBeenCalledWith('project:10:typing', '-inf', String(baseTime));
      expect(redisServiceMock.zadd).toHaveBeenCalledWith('project:10:typing', baseTime + 10000, '5');
      expect(redisServiceMock.expire).toHaveBeenCalledWith('project:10:typing', 86400);
    });

    it('unregisters user typing status from Redis', async () => {
      redisServiceMock.zrem.mockResolvedValue(1);
      redisServiceMock.zremrangebyscore.mockResolvedValue(0);

      const baseTime = 1600000000000;
      jest.spyOn(Date, 'now').mockReturnValue(baseTime);

      await service.unregisterProjectTyping(10, 5);

      expect(redisServiceMock.zrem).toHaveBeenCalledWith('project:10:typing', '5');
      expect(redisServiceMock.zremrangebyscore).toHaveBeenCalledWith('project:10:typing', '-inf', String(baseTime));
    });

    it('retrieves active typing user IDs after purging expired ones', async () => {
      redisServiceMock.zremrangebyscore.mockResolvedValue(2);
      redisServiceMock.zrange.mockResolvedValue(['5', '12']);

      const baseTime = 1600000000000;
      jest.spyOn(Date, 'now').mockReturnValue(baseTime);

      const typingIds = await service.getProjectTypingUserIds(10);

      expect(redisServiceMock.zremrangebyscore).toHaveBeenCalledWith('project:10:typing', '-inf', String(baseTime));
      expect(redisServiceMock.zrange).toHaveBeenCalledWith('project:10:typing', 0, -1);
      expect(typingIds).toEqual([5, 12]);
    });
  });
});
