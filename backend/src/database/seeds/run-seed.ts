import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../typeorm.config';
import { runSeed } from './seed';

/** CLI entry: `npm run seed` (dev) or `npm run seed:prod` (compiled, used in Docker). */
async function main() {
  config();
  const dataSource = new DataSource(buildDataSourceOptions());
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
    await runSeed(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  Logger.error(error, undefined, 'Seed');
  process.exit(1);
});
