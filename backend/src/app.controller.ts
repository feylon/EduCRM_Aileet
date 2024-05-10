import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  @Get('health')
  async health() {
    const [database, redis] = await Promise.all([
      this.dataSource
        .query('SELECT 1')
        .then(() => 'up')
        .catch(() => 'down'),
      this.redis
        .ping()
        .then((ok) => (ok ? 'up' : 'down'))
        .catch(() => 'down'),
    ]);
    return { status: 'ok', database, redis, timestamp: new Date().toISOString() };
  }
}
