import type { Pool, QueryResultRow } from 'pg';

import type { WechatAccount } from '../type/wechat.js';
import type { WechatRepository } from './wechat.repository.js';

interface WechatAccountRow extends QueryResultRow {
  userId: string;
  appId: string;
  encryptedAppSecret: string;
  defaultAuthor: string;
  defaultDigest: string;
  createdAt: Date;
  updatedAt: Date;
}

const WECHAT_ACCOUNT_COLUMNS = `
  user_id AS "userId",
  app_id AS "appId",
  app_secret_ciphertext AS "encryptedAppSecret",
  default_author AS "defaultAuthor",
  default_digest AS "defaultDigest",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export function createPostgresWechatRepository(pool: Pool): WechatRepository {
  return {
    async findAccountByUserId(userId) {
      const result = await pool.query<WechatAccountRow>(
        `SELECT ${WECHAT_ACCOUNT_COLUMNS} FROM wechat_accounts WHERE user_id = $1`,
        [userId],
      );

      return result.rows[0] ?? null;
    },

    async upsertAccount(input) {
      const result = await pool.query<WechatAccountRow>(
        `
          INSERT INTO wechat_accounts (
            user_id,
            app_id,
            app_secret_ciphertext,
            default_author,
            default_digest
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id) DO UPDATE SET
            app_id = EXCLUDED.app_id,
            app_secret_ciphertext = EXCLUDED.app_secret_ciphertext,
            default_author = EXCLUDED.default_author,
            default_digest = EXCLUDED.default_digest,
            updated_at = now()
          RETURNING ${WECHAT_ACCOUNT_COLUMNS}
        `,
        [
          input.userId,
          input.appId,
          input.encryptedAppSecret,
          input.defaultAuthor,
          input.defaultDigest,
        ],
      );

      const account = result.rows[0];
      if (!account) throw new Error('Failed to save WeChat account');
      return account;
    },

    async deleteAccount(userId) {
      await pool.query('DELETE FROM wechat_accounts WHERE user_id = $1', [userId]);
    },
  };
}
