import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import { runMigrations } from './migration-runner.js';
import { createPostgresPool } from './postgres.js';

if (existsSync('.env')) {
  loadEnvFile('.env');
}

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured');
}

const pool = createPostgresPool(databaseUrl);

try {
  const appliedMigrations = await runMigrations(pool);
  const summary =
    appliedMigrations.length > 0 ? appliedMigrations.join(', ') : 'database is already up to date';
  console.info(`Database migrations complete: ${summary}`);
} finally {
  await pool.end();
}
