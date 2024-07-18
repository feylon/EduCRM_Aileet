import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { RedisService } from './redis.service';

/**
 * Rate-limit counters stored in Redis, so limits are shared by every backend
 * instance (the default in-memory storage only works for a single process).
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttle:${key}`;
    const client = this.redis.raw;
    const [[, totalHits], [, pttl]] = (await client
      .multi()
      .incr(redisKey)
      .pttl(redisKey)
      .exec()) as [[null, number], [null, number]];

    let timeToExpire = pttl;
    if (pttl < 0) {
      await client.pexpire(redisKey, ttl);
      timeToExpire = ttl;
    }
    return { totalHits, timeToExpire: Math.ceil(timeToExpire / 1000) };
  }
}
