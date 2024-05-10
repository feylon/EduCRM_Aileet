import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Thin wrapper around ioredis with the helpers the application actually needs:
 * JSON caching (cache-aside), counters with TTL and pattern invalidation.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  get raw(): Redis {
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  /** Increments a counter and sets its TTL on first increment. */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const value = await this.client.incr(key);
    if (value === 1) await this.client.expire(key, ttlSeconds);
    return value;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /** Cache-aside helper: returns cached value or computes, stores and returns it. */
  async remember<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await factory();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /** Deletes every key matching the pattern (pattern is relative to the key prefix). */
  async delByPattern(pattern: string): Promise<number> {
    const prefix = this.client.options.keyPrefix || '';
    let cursor = '0';
    let removed = 0;
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}${pattern}`, 'COUNT', 100);
      cursor = next;
      if (keys.length) {
        // SCAN returns full keys, strip the prefix because ioredis adds it on DEL
        removed += await this.client.del(...keys.map((key) => key.slice(prefix.length)));
      }
    } while (cursor !== '0');
    return removed;
  }

  async ping(): Promise<boolean> {
    return (await this.client.ping()) === 'PONG';
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
