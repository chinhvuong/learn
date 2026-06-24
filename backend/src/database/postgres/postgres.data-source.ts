import { join } from 'path';

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * TypeORM DataSource for PostgreSQL (CLI - migrations)
 * This is separate from the runtime database module
 */
const isLogging = process.env.DATABASE_LOGGING === 'true';

export const PostgresDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'starter_db',

  // Resolved relative to this file so the same data source works in dev
  // (loads `.ts` neighbors from `src/` via ts-node) and in prod (loads
  // compiled `.js` neighbors from `dist/`).
  entities: [join(__dirname, 'entities/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],

  synchronize: false,
  logging: isLogging,
  migrationsTransactionMode: 'each',
});
