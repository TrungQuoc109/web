import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly redisService: RedisService) {}

  private getPresenceKey(projectId: number): string {
    return `project:${projectId}:presence`;
  }

  private getUserSocketsKey(projectId: number, userId: number): string {
    return `project:${projectId}:presence:${userId}`;
  }

  /**
   * Registers a socket connection for a user in a specific project.
   */
  async registerProjectPresence(
    projectId: number,
    userId: number,
    socketId: string,
  ): Promise<void> {
    const presenceKey = this.getPresenceKey(projectId);
    const userSocketsKey = this.getUserSocketsKey(projectId, userId);

    try {
      // Add the socket connection ID to the user's set of active sockets in this project
      await this.redisService.sadd(userSocketsKey, socketId);
      // Mark the user as online by adding their ID to the project's online users set
      await this.redisService.sadd(presenceKey, String(userId));

      // Apply a safety expiration (24h) to avoid orphan keys in case of hard crashes
      await this.redisService.expire(userSocketsKey, 86400);
      await this.redisService.expire(presenceKey, 86400);
    } catch (err) {
      this.logger.error(
        `Failed to register presence for user ${userId} in project ${projectId}:`,
        err,
      );
    }
  }

  /**
   * Unregisters a socket connection for a user in a specific project.
   */
  async unregisterProjectPresence(
    projectId: number,
    userId: number,
    socketId: string,
  ): Promise<void> {
    const presenceKey = this.getPresenceKey(projectId);
    const userSocketsKey = this.getUserSocketsKey(projectId, userId);

    try {
      // Remove this socket connection ID
      await this.redisService.srem(userSocketsKey, socketId);

      // Check how many socket connections are left for this user
      const remainingSockets = await this.redisService.scard(userSocketsKey);
      if (remainingSockets === 0) {
        // No active socket connections left across all nodes, remove from online list
        await this.redisService.srem(presenceKey, String(userId));
        // Clean up the key itself
        await this.redisService.del(userSocketsKey);
      }
    } catch (err) {
      this.logger.error(
        `Failed to unregister presence for user ${userId} in project ${projectId}:`,
        err,
      );
    }
  }

  /**
   * Retrieves all unique online user IDs in a specific project across all cluster nodes.
   */
  async getProjectOnlineUserIds(projectId: number): Promise<number[]> {
    const presenceKey = this.getPresenceKey(projectId);
    try {
      const userIds = await this.redisService.smembers(presenceKey);
      return userIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    } catch (err) {
      this.logger.error(
        `Failed to retrieve online user IDs for project ${projectId}:`,
        err,
      );
      return [];
    }
  }

  private getTypingKey(projectId: number): string {
    return `project:${projectId}:typing`;
  }

  /**
   * Registers or updates a user's typing status in a specific project.
   * Utilizes a Sorted Set where score is the absolute expiration timestamp (now + ttlMs).
   * Automatically purges expired typing states using ZREMRANGEBYSCORE.
   */
  async registerProjectTyping(
    projectId: number,
    userId: number,
    ttlMs: number = 10000,
  ): Promise<void> {
    const typingKey = this.getTypingKey(projectId);
    const now = Date.now();
    const expiresAt = now + ttlMs;

    try {
      // Clean up expired typers first
      await this.redisService.zremrangebyscore(typingKey, '-inf', String(now));
      // Add or update the current typing user with absolute expiration timestamp as score
      await this.redisService.zadd(typingKey, expiresAt, String(userId));
      // Set a general safety key expiration of 24h to avoid orphan keys
      await this.redisService.expire(typingKey, 86400);
    } catch (err) {
      this.logger.error(
        `Failed to register typing status for user ${userId} in project ${projectId}:`,
        err,
      );
    }
  }

  /**
   * Unregisters a user's typing status in a specific project.
   */
  async unregisterProjectTyping(
    projectId: number,
    userId: number,
  ): Promise<void> {
    const typingKey = this.getTypingKey(projectId);
    const now = Date.now();

    try {
      await this.redisService.zrem(typingKey, String(userId));
      // Proactively clean up any other expired typers in this project
      await this.redisService.zremrangebyscore(typingKey, '-inf', String(now));
    } catch (err) {
      this.logger.error(
        `Failed to unregister typing status for user ${userId} in project ${projectId}:`,
        err,
      );
    }
  }

  /**
   * Retrieves all unique typing user IDs in a specific project.
   * Automatically clears expired entries prior to returning active users.
   */
  async getProjectTypingUserIds(projectId: number): Promise<number[]> {
    const typingKey = this.getTypingKey(projectId);
    const now = Date.now();

    try {
      // Clear expired entries first
      await this.redisService.zremrangebyscore(typingKey, '-inf', String(now));
      // Retrieve all remaining active users
      const userIds = await this.redisService.zrange(typingKey, 0, -1);
      return userIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    } catch (err) {
      this.logger.error(
        `Failed to retrieve typing user IDs for project ${projectId}:`,
        err,
      );
      return [];
    }
  }
}
