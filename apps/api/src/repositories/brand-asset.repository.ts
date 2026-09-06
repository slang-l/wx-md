import type {
  BrandAsset,
  CreateBrandAssetInput,
  UpdateBrandAssetInput,
} from '../type/brand-asset.js';

export interface BrandAssetRepository {
  listByUserId(userId: string): Promise<BrandAsset[]>;
  create(input: CreateBrandAssetInput): Promise<BrandAsset>;
  update(input: UpdateBrandAssetInput): Promise<BrandAsset | null>;
  delete(userId: string, assetId: string): Promise<boolean>;
}

