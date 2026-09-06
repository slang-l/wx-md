import { Pool, type PoolConfig } from 'pg';

const DEFAULT_POOL_CONFIG: Readonly<PoolConfig> = {
  application_name: 'wx-md-api',
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  max: 10,
};

/** Create the process-wide PostgreSQL connection pool used by the API. */
export function createPostgresPool(
  connection: string | PoolConfig,
): Pool {
  const config = typeof connection === 'string'
    ? { connectionString: connection }
    : connection;

  return new Pool({
    ...DEFAULT_POOL_CONFIG,
    ...config,
  });
}
