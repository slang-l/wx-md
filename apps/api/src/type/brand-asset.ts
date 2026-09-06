export const brandAssetCategories = ['logo', 'qr-code', 'avatar', 'product', 'other'] as const;

export type BrandAssetCategory = (typeof brandAssetCategories)[number];

export interface BrandAsset {
  id: string;
  userId: string;
  name: string;
  category: BrandAssetCategory;
  tags: string[];
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif';
  sizeBytes: number;
  imageData: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBrandAssetInput {
  id: string;
  userId: string;
  name: string;
  category: BrandAssetCategory;
  tags: string[];
  mimeType: BrandAsset['mimeType'];
  sizeBytes: number;
  imageData: Buffer;
}

export interface UpdateBrandAssetInput {
  userId: string;
  assetId: string;
  name: string;
  category: BrandAssetCategory;
  tags: string[];
}

