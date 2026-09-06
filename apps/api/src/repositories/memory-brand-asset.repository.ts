import type { BrandAssetRepository } from './brand-asset.repository.js';
import type { BrandAsset } from '../type/brand-asset.js';

export function createMemoryBrandAssetRepository(): BrandAssetRepository {
  const assets = new Map<string, BrandAsset>();

  return {
    async listByUserId(userId) {
      return [...assets.values()]
        .filter((asset) => asset.userId === userId)
        .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
        .map(cloneAsset);
    },

    async create(input) {
      const now = new Date();
      const asset: BrandAsset = {
        ...input,
        tags: [...input.tags],
        imageData: Buffer.from(input.imageData),
        createdAt: now,
        updatedAt: now,
      };
      assets.set(asset.id, asset);
      return cloneAsset(asset);
    },

    async update(input) {
      const asset = assets.get(input.assetId);
      if (!asset || asset.userId !== input.userId) return null;

      const updated: BrandAsset = {
        ...asset,
        name: input.name,
        category: input.category,
        tags: [...input.tags],
        updatedAt: new Date(),
      };
      assets.set(updated.id, updated);
      return cloneAsset(updated);
    },

    async delete(userId, assetId) {
      const asset = assets.get(assetId);
      if (!asset || asset.userId !== userId) return false;
      return assets.delete(assetId);
    },
  };
}

function cloneAsset(asset: BrandAsset): BrandAsset {
  return {
    ...asset,
    tags: [...asset.tags],
    imageData: Buffer.from(asset.imageData),
    createdAt: new Date(asset.createdAt),
    updatedAt: new Date(asset.updatedAt),
  };
}

