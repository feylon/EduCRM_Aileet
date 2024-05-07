import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config';

// Used by the TypeORM CLI: `npm run migration:run`, `npm run migration:generate` ...
config();

export default new DataSource(buildDataSourceOptions());
