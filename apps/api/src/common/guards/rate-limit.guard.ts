import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  limit: number;
  ttlSeconds: number;
}

export const RateLimit = (limit: number, ttlSeconds: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttlSeconds });

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const key = `${ip}:${context.getClass().name}:${context.getHandler().name}`;

    const now = Date.now();
    const current = this.hits.get(key);

    if (!current || now > current.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + options.ttlSeconds * 1000 });
      if (res && res.setHeader) {
        res.setHeader('X-RateLimit-Limit', options.limit);
        res.setHeader('X-RateLimit-Remaining', options.limit - 1);
        res.setHeader(
          'X-RateLimit-Reset',
          Math.ceil((now + options.ttlSeconds * 1000) / 1000),
        );
      }
      return true;
    }

    if (current.count >= options.limit) {
      if (res && res.setHeader) {
        res.setHeader('X-RateLimit-Limit', options.limit);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader(
          'Retry-After',
          Math.ceil((current.resetAt - now) / 1000),
        );
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please slow down and try again later.',
          retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    if (res && res.setHeader) {
      res.setHeader('X-RateLimit-Limit', options.limit);
      res.setHeader('X-RateLimit-Remaining', options.limit - current.count);
      res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetAt / 1000));
    }
    return true;
  }
}
