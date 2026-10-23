import { Injectable } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorageService extends ThrottlerStorageService {
  private readonly redis: Redis;

  constructor() {
    super();
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6380');
  }

  override async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    const fullKey = `throttle:${throttlerName}:${key}`;
    const now = Date.now();
    const windowStart = now - ttl;

    await this.redis.zremrangebyscore(fullKey, 0, windowStart);
    await this.redis.zadd(fullKey, now, `${now}:${Math.random()}`);
    const count = await this.redis.zcard(fullKey);
    await this.redis.expire(fullKey, Math.ceil(ttl / 1000));

    return {
      totalHits: count,
      timeToExpire: ttl,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
