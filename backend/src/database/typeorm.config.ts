import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/**
 * Shared TypeORM options used both by the Nest application and by the TypeORM CLI
 * (migrations / seed). Schema changes are applied ONLY through migrations.
 */
export function buildDataSourceOptions(env: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DATABASE_HOST || 'postgres',
    port: parseInt(env.DATABASE_PORT || '5432', 10),
    database: env.DATABASE_NAME || 'educrm',
    username: env.DATABASE_USER || 'educrm',
    password: env.DATABASE_PASSWORD || '',
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    migrationsRun: env.DATABASE_RUN_MIGRATIONS !== 'false',
    logging: env.DATABASE_LOGGING === 'true',
  };
}
