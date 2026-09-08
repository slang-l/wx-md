import { randomUUID } from 'node:crypto';

import type { Pool, PoolClient, QueryResultRow } from 'pg';

import type { RefreshSession, User, UserRole, UserStatus } from '../type/auth.js';
import type { AuthRepository, CreateRefreshSessionInput } from './auth.repository.js';

interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshSessionRow extends QueryResultRow {
  id: string;
  tokenHash: string;
  userId: string;
  familyId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByHash: string | null;
  ip: string | null;
  userAgent: string | null;
}

interface RotatedSessionSourceRow extends QueryResultRow {
  userId: string;
  familyId: string;
  expiresAt: Date;
}

interface RefreshFamilyRow extends QueryResultRow {
  familyId: string;
}

interface PostgresErrorLike {
  code?: string;
  constraint?: string;
}

const USER_COLUMNS = `
  id,
  email,
  password_hash AS "passwordHash",
  name,
  role,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const REFRESH_SESSION_COLUMNS = `
  id,
  token_hash AS "tokenHash",
  user_id AS "userId",
  family_id AS "familyId",
  created_at AS "createdAt",
  expires_at AS "expiresAt",
  revoked_at AS "revokedAt",
  replaced_by_hash AS "replacedByHash",
  ip,
  user_agent AS "userAgent"
`;

function mapUser(row: UserRow): User {
  return {
    ...row,
    role: row.role as UserRole,
    status: row.status as UserStatus,
  };
}

function mapRefreshSession(row: RefreshSessionRow): RefreshSession {
  return row;
}

function isPostgresError(error: unknown): error is PostgresErrorLike {
  return typeof error === 'object' && error !== null;
}

function translateUserWriteError(error: unknown): Error {
  if (
    isPostgresError(error) &&
    error.code === '23505' &&
    error.constraint === 'users_email_unique'
  ) {
    return new Error('EMAIL_ALREADY_EXISTS', { cause: error });
  }

  return error instanceof Error ? error : new Error('Database write failed');
}

async function rollback(client: PoolClient): Promise<void> {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Do not replace the original database error with a rollback error.
  }
}

/**
 * 同一 Refresh Token family 的轮换、退出和重放撤销必须串行执行。
 * hashtextextended 的碰撞最多造成无关 family 短暂互相等待，不会破坏正确性。
 */
async function lockRefreshFamily(client: PoolClient, familyId: string): Promise<void> {
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [familyId]);
}

async function insertRefreshSession(
  client: Pool | PoolClient,
  input: CreateRefreshSessionInput,
): Promise<RefreshSession> {
  const result = await client.query<RefreshSessionRow>(
    `
      INSERT INTO refresh_sessions (
        id,
        token_hash,
        user_id,
        family_id,
        expires_at,
        ip,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${REFRESH_SESSION_COLUMNS}
    `,
    [
      randomUUID(),
      input.tokenHash,
      input.userId,
      input.familyId,
      input.expiresAt,
      input.ip,
      input.userAgent,
    ],
  );

  const session = result.rows[0];
  if (!session) {
    throw new Error('Failed to create refresh session');
  }

  return mapRefreshSession(session);
}

export function createPostgresAuthRepository(pool: Pool): AuthRepository {
  return {
    async upsertSystemUser(input) {
      const result = await pool.query<UserRow>(
        `
          INSERT INTO users (
            id,
            email,
            password_hash,
            name,
            role,
            status
          )
          VALUES ($1, $2, $3, $4, $5, 'active')
          ON CONFLICT (email) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            status = 'active',
            updated_at = now()
          RETURNING ${USER_COLUMNS}
        `,
        [
          randomUUID(),
          input.email.toLowerCase().trim(),
          input.passwordHash,
          input.name.trim(),
          input.role ?? 'user',
        ],
      );
      const user = result.rows[0];

      if (!user) {
        throw new Error('Failed to upsert system user');
      }

      return mapUser(user);
    },

    async createUserWithRefreshSession(userInput, sessionInput) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const userResult = await client.query<UserRow>(
          `
            INSERT INTO users (
              id,
              email,
              password_hash,
              name,
              role
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${USER_COLUMNS}
          `,
          [
            randomUUID(),
            userInput.email.toLowerCase().trim(),
            userInput.passwordHash,
            userInput.name.trim(),
            userInput.role ?? 'user',
          ],
        );
        const userRow = userResult.rows[0];

        if (!userRow) {
          throw new Error('Failed to create user');
        }

        await insertRefreshSession(client, {
          ...sessionInput,
          userId: userRow.id,
        });
        await client.query('COMMIT');
        return mapUser(userRow);
      } catch (error) {
        await rollback(client);
        throw translateUserWriteError(error);
      } finally {
        client.release();
      }
    },

    async findUserByEmail(email) {
      const result = await pool.query<UserRow>(
        `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
        [email.toLowerCase().trim()],
      );
      const row = result.rows[0];
      return row ? mapUser(row) : null;
    },

    async findUserById(userId) {
      const result = await pool.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [
        userId,
      ]);
      const row = result.rows[0];
      return row ? mapUser(row) : null;
    },

    async createRefreshSession(input) {
      return insertRefreshSession(pool, input);
    },

    async findRefreshSessionByTokenHash(tokenHash) {
      const result = await pool.query<RefreshSessionRow>(
        `
          SELECT ${REFRESH_SESSION_COLUMNS}
          FROM refresh_sessions
          WHERE token_hash = $1
        `,
        [tokenHash],
      );
      const row = result.rows[0];
      return row ? mapRefreshSession(row) : null;
    },

    async revokeRefreshSession(tokenHash, replacedByHash = null) {
      await pool.query(
        `
          UPDATE refresh_sessions
          SET revoked_at = now(), replaced_by_hash = $2
          WHERE token_hash = $1 AND revoked_at IS NULL
        `,
        [tokenHash, replacedByHash],
      );
    },

    async revokeRefreshFamilyByTokenHash(tokenHash) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const familyResult = await client.query<RefreshFamilyRow>(
          `
            SELECT family_id AS "familyId"
            FROM refresh_sessions
            WHERE token_hash = $1
          `,
          [tokenHash],
        );
        const family = familyResult.rows[0];

        if (!family) {
          await client.query('ROLLBACK');
          return;
        }

        await lockRefreshFamily(client, family.familyId);
        await client.query(
          `
            UPDATE refresh_sessions
            SET revoked_at = now()
            WHERE family_id = $1 AND revoked_at IS NULL
          `,
          [family.familyId],
        );
        await client.query('COMMIT');
      } catch (error) {
        await rollback(client);
        throw error;
      } finally {
        client.release();
      }
    },

    async revokeRefreshFamily(familyId) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        await lockRefreshFamily(client, familyId);
        await client.query(
          `
            UPDATE refresh_sessions
            SET revoked_at = now()
            WHERE family_id = $1 AND revoked_at IS NULL
          `,
          [familyId],
        );
        await client.query('COMMIT');
      } catch (error) {
        await rollback(client);
        throw error;
      } finally {
        client.release();
      }
    },

    async rotateRefreshSession(currentHash, nextInput) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        // 先读取 family，再取得 family 级锁。取得锁之后的条件 UPDATE 会重新
        // 检查 Token 是否仍然可消费，从而安全处理同 Token 的并发请求。
        const sourceResult = await client.query<RefreshFamilyRow>(
          `
            SELECT family_id AS "familyId"
            FROM refresh_sessions
            WHERE token_hash = $1
          `,
          [currentHash],
        );
        const source = sourceResult.rows[0];

        if (!source) {
          await client.query('ROLLBACK');
          return false;
        }

        await lockRefreshFamily(client, source.familyId);
        const currentResult = await client.query<RotatedSessionSourceRow>(
          `
            UPDATE refresh_sessions
            SET revoked_at = now(), replaced_by_hash = $2
            WHERE token_hash = $1
              AND revoked_at IS NULL
              AND expires_at > now()
            RETURNING
              user_id AS "userId",
              family_id AS "familyId",
              expires_at AS "expiresAt"
          `,
          [currentHash, nextInput.tokenHash],
        );
        const current = currentResult.rows[0];

        if (!current) {
          await client.query('ROLLBACK');
          return false;
        }

        await insertRefreshSession(client, {
          tokenHash: nextInput.tokenHash,
          userId: current.userId,
          familyId: current.familyId,
          // Keep the family's original absolute expiration during rotation.
          expiresAt: current.expiresAt,
          ip: nextInput.ip,
          userAgent: nextInput.userAgent,
        });
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await rollback(client);
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
