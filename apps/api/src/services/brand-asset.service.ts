import { randomUUID } from 'node:crypto';

import { AppError } from '../errors.js';
import type { BrandAssetRepository } from '../repositories/brand-asset.repository.js';
import type { BrandAsset, BrandAssetCategory } from '../type/brand-asset.js';

const MAX_ASSET_COUNT = 100;
const MAX_IMAGE_SIZE_BYTES = 1_500_000;

export interface BrandAssetView {
  id: string;
  name: string;
  category: BrandAssetCategory;
  tags: string[];
  mimeType: BrandAsset['mimeType'];
  sizeBytes: number;
  dataUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateBrandAssetRequest {
  name: string;
  category: BrandAssetCategory;
  tags: string[];
  mimeType: BrandAsset['mimeType'];
  data: string;
}

interface UpdateBrandAssetRequest {
  name: string;
  category: BrandAssetCategory;
  tags: string[];
}

export interface BrandAssetService {
  list(userId: string): Promise<{ assets: BrandAssetView[]; limit: number }>;
  create(userId: string, input: CreateBrandAssetRequest): Promise<BrandAssetView>;
  update(userId: string, assetId: string, input: UpdateBrandAssetRequest): Promise<BrandAssetView>;
  delete(userId: string, assetId: string): Promise<void>;
}

export function createBrandAssetService(repository: BrandAssetRepository): BrandAssetService {
  return {
    async list(userId) {
      const assets = await repository.listByUserId(userId);
      return { assets: assets.map(toView), limit: MAX_ASSET_COUNT };
    },

    async create(userId, input) {
      const existing = await repository.listByUserId(userId);
      if (existing.length >= MAX_ASSET_COUNT) {
        throw new AppError(409, 'BRAND_ASSET_LIMIT_REACHED', `Brand asset limit is ${MAX_ASSET_COUNT}`);
      }

      const imageData = decodeAndValidateImage(input.data, input.mimeType);
      const asset = await repository.create({
        id: randomUUID(),
        userId,
        name: input.name,
        category: input.category,
        tags: input.tags,
        mimeType: input.mimeType,
        sizeBytes: imageData.byteLength,
        imageData,
      });
      return toView(asset);
    },

    async update(userId, assetId, input) {
      const asset = await repository.update({ userId, assetId, ...input });
      if (!asset) {
        throw new AppError(404, 'BRAND_ASSET_NOT_FOUND', 'Brand asset not found');
      }
      return toView(asset);
    },

    async delete(userId, assetId) {
      const deleted = await repository.delete(userId, assetId);
      if (!deleted) {
        throw new AppError(404, 'BRAND_ASSET_NOT_FOUND', 'Brand asset not found');
      }
    },
  };
}

function decodeAndValidateImage(data: string, mimeType: BrandAsset['mimeType']): Buffer {
  const imageData = Buffer.from(data, 'base64');
  if (imageData.byteLength === 0 || imageData.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError(400, 'INVALID_BRAND_ASSET_IMAGE', 'Image must be no larger than 1.5 MB');
  }

  const isExpectedType = (() => {
    if (mimeType === 'image/png') {
      return imageData.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (mimeType === 'image/jpeg') {
      return imageData[0] === 0xff && imageData[1] === 0xd8 && imageData[2] === 0xff;
    }
    return imageData.subarray(0, 6).toString('ascii') === 'GIF87a'
      || imageData.subarray(0, 6).toString('ascii') === 'GIF89a';
  })();

  if (!isExpectedType) {
    throw new AppError(400, 'INVALID_BRAND_ASSET_IMAGE', 'Image data does not match its media type');
  }

  return imageData;
}

function toView(asset: BrandAsset): BrandAssetView {
  return {
    id: asset.id,
    name: asset.name,
    category: asset.category,
    tags: [...asset.tags],
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    dataUrl: `data:${asset.mimeType};base64,${asset.imageData.toString('base64')}`,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

