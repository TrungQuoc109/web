import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    const host = configService.get<string>('REDIS_HOST') ?? '127.0.0.1';
    const port = configService.get<number>('REDIS_PORT') ?? 6379;
    const password = configService.get<string>('REDIS_PASSWORD');

    super({
      host,
      port: Number(port),
      password,
      // Fallback reconnection strategy
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.on('connect', () => {
      this.logger.log(`Successfully connected to Redis at ${host}:${port}`);
    });

    this.on('error', (err) => {
      this.logger.error('Redis error encountered:', err);
    });
  }

  async onModuleInit(): Promise<void> {
    // Ping to verify connection when the module starts
    try {
      await this.ping();
    } catch (err) {
      this.logger.warn('Failed to ping Redis during startup:', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection...');
    await this.quit();
  }
}
