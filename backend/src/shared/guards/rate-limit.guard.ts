import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

const RATE_LIMIT_METADATA_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, options);

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
    const bucketKey = `${options.keyPrefix ?? ''}:${method}:${url}:${ip}`;

    const now = Date.now();
    const windowMs = Math.max(1, options.windowMs);
    const max = Math.max(1, options.max);

    const existing = this.buckets.get(bucketKey);
    const bucket =
      !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : existing;

    bucket.count += 1;
    this.buckets.set(bucketKey, bucket);

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader?.('X-RateLimit-Limit', max);
    res.setHeader?.('X-RateLimit-Remaining', remaining);
    res.setHeader?.('X-RateLimit-Reset', Math.floor(bucket.resetAt / 1000));

    if (bucket.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader?.('Retry-After', retryAfterSeconds);
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Opportunistic cleanup to avoid unbounded growth.
    if (this.buckets.size > 10_000) {
      for (const [key, value] of this.buckets.entries()) {
        if (value.resetAt <= now) {
          this.buckets.delete(key);
        }
      }
    }

    return true;
  }
}
