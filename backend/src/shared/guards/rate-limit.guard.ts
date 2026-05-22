import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

const RATE_LIMIT_METADATA_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | null>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<{ ip?: string; headers?: Record<string, unknown>; originalUrl?: string; method?: string }>();
    const res = http.getResponse<{ setHeader?: (name: string, value: string | number) => void }>();

    const ip =
      req.ip ||
      (typeof req.headers?.['x-forwarded-for'] === 'string'
        ? (req.headers['x-forwarded-for'] as string).split(',')[0]?.trim()
        : '') ||
      'unknown';

    const url = (req.originalUrl ?? '').split('?')[0] ?? '';
    const method = (req.method ?? '').toUpperCase();
    
    // Construct a unique Redis key for this rate limit bucket
    const bucketKey = `ratelimit:${options.keyPrefix ?? ''}:${method}:${url}:${ip}`;

    const windowMs = Math.max(1, options.windowMs);
    const max = Math.max(1, options.max);

    // Execute atomic pipelined commands in Redis:
    // 1. INCR key - increments the request counter
    // 2. PTTL key - gets the remaining Time-To-Live in milliseconds
    const pipeline = this.redisService.multi();
    pipeline.incr(bucketKey);
    pipeline.pttl(bucketKey);
    const results = await pipeline.exec();

    if (!results || results.length < 2) {
      throw new HttpException(
        'Rate limit service temporarily unavailable.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // ioredis exec returns results in the format: [[err, val], [err, val]]
    const incrError = results[0][0];
    const current = results[0][1] as number;
    const pttlError = results[1][0];
    let pttl = results[1][1] as number;

    if (incrError || pttlError) {
      throw new HttpException(
        'Rate limit transaction failed.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // If PTTL is -1, it means the key exists but does not have an expiration.
    // This happens on the very first INCR when the key is created, or if a previous EXPIRE call failed.
    if (pttl === -1) {
      await this.redisService.pexpire(bucketKey, windowMs);
      pttl = windowMs;
    }

    const remainingTimeMs = pttl > 0 ? pttl : windowMs;
    const resetAt = Date.now() + remainingTimeMs;
    const remaining = Math.max(0, max - current);

    // Set rate limit standard response headers
    res.setHeader?.('X-RateLimit-Limit', max);
    res.setHeader?.('X-RateLimit-Remaining', remaining);
    res.setHeader?.('X-RateLimit-Reset', Math.floor(resetAt / 1000));

    // If the client exceeded the rate limit
    if (current > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil(remainingTimeMs / 1000));
      res.setHeader?.('Retry-After', retryAfterSeconds);
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
