import type { Pool, QueryResultRow } from 'pg';

import type { BrandAssetRepository } from './brand-asset.repository.js';
import type { BrandAsset, BrandAssetCategory } from '../type/brand-asset.js';

interface BrandAssetRow extends QueryResultRow {
  id: string;
  userId: string;
  name: string;
  category: BrandAssetCategory;
  tags: string[];
  mimeType: BrandAsset['mimeType'];
  sizeBytes: number;
  imageData: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const BRAND_ASSET_COLUMNS = `
  id,
  user_id AS "userId",
  name,
  category,
  tags,
  mime_type AS "mimeType",
  size_bytes AS "sizeBytes",
  image_data AS "imageData",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export function createPostgresBrandAssetRepository(pool: Pool): BrandAssetRepository {
  return {
    async listByUserId(userId) {
      const result = await pool.query<BrandAssetRow>(
        `SELECT ${BRAND_ASSET_COLUMNS}
         FROM brand_assets
         WHERE user_id = $1
         ORDER BY updated_at DESC, id`,
        [userId],
      );
      return result.rows;
    },

    async create(input) {
      const result = await pool.query<BrandAssetRow>(
        `INSERT INTO brand_assets (
           id, user_id, name, category, tags, mime_type, size_bytes, image_data
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING ${BRAND_ASSET_COLUMNS}`,
        [
          input.id,
          input.userId,
          input.name,
          input.category,
          input.tags,
          input.mimeType,
          input.sizeBytes,
          input.imageData,
        ],
      );

      const asset = result.rows[0];
      if (!asset) throw new Error('Failed to create brand asset');
      return asset;
    },

    async update(input) {
      const result = await pool.query<BrandAssetRow>(
        `UPDATE brand_assets
         SET name = $3, category = $4, tags = $5, updated_at = now()
         WHERE user_id = $1 AND id = $2
         RETURNING ${BRAND_ASSET_COLUMNS}`,
        [input.userId, input.assetId, input.name, input.category, input.tags],
      );
      return result.rows[0] ?? null;
    },

    async delete(userId, assetId) {
      const result = await pool.query('DELETE FROM brand_assets WHERE user_id = $1 AND id = $2', [
        userId,
        assetId,
      ]);
      return result.rowCount === 1;
    },
  };
}
