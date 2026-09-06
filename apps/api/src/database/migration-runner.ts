import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Pool, PoolClient, QueryResultRow } from 'pg';

const DEFAULT_MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../../migrations/', import.meta.url),
);
const MIGRATION_FILE_PATTERN = /^\d+_[a-z0-9][a-z0-9_-]*\.sql$/;
const MIGRATION_LOCK_NAME = 'wx-md:schema-migrations';

interface AppliedMigrationRow extends QueryResultRow {
  name: string;
  checksum: string;
}

export interface RunMigrationsOptions {
  migrationsDirectory?: string;
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Preserve the migration error if PostgreSQL already aborted the session.
  }
}

/**
 * Apply pending SQL migrations in lexical order.
 *
 * A session-level advisory lock serializes runners from concurrently starting
 * API instances. Each individual migration and its bookkeeping row are
 * committed in the same transaction. Applied migrations are immutable: a
 * checksum mismatch fails startup instead of silently accepting edited SQL.
 */
export async function runMigrations(
  pool: Pool,
  options: RunMigrationsOptions = {},
): Promise<string[]> {
  const migrationsDirectory =
    options.migrationsDirectory ?? DEFAULT_MIGRATIONS_DIRECTORY;
  const migrationNames = (await readdir(migrationsDirectory, {
    withFileTypes: true,
  }))
    .filter(
      (entry) => entry.isFile() && MIGRATION_FILE_PATTERN.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort();
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query(
      'SELECT pg_advisory_lock(hashtext($1)::bigint)',
      [MIGRATION_LOCK_NAME],
    );
    lockAcquired = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const appliedResult = await client.query<AppliedMigrationRow>(
      'SELECT name, checksum FROM schema_migrations',
    );
    const appliedByName = new Map(
      appliedResult.rows.map((migration) => [
        migration.name,
        migration.checksum,
      ]),
    );
    const newlyApplied: string[] = [];

    for (const migrationName of migrationNames) {
      const sql = await readFile(join(migrationsDirectory, migrationName), 'utf8');
      // Normalize checkout-specific line endings so a Windows-to-Linux deploy
      // does not make an already-applied migration appear to have changed.
      const checksum = createHash('sha256')
        .update(sql.replaceAll('\r\n', '\n'), 'utf8')
        .digest('hex');
      const appliedChecksum = appliedByName.get(migrationName);

      if (appliedChecksum) {
        if (appliedChecksum !== checksum) {
          throw new Error(
            `Applied migration ${migrationName} has been modified`,
          );
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        // Migration SQL is trusted, version-controlled application code.
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
          [migrationName, checksum],
        );
        await client.query('COMMIT');
        newlyApplied.push(migrationName);
      } catch (error) {
        await rollback(client);
        throw error;
      }
    }

    return newlyApplied;
  } finally {
    if (lockAcquired) {
      try {
        await client.query(
          'SELECT pg_advisory_unlock(hashtext($1)::bigint)',
          [MIGRATION_LOCK_NAME],
        );
      } finally {
        client.release();
      }
    } else {
      client.release();
    }
  }
}
