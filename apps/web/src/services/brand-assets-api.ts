import { authenticatedRequest } from './auth-api';

export const brandAssetCategories = ['logo', 'qr-code', 'avatar', 'product', 'other'] as const;

export type BrandAssetCategory = (typeof brandAssetCategories)[number];

export interface BrandAsset {
  id: string;
  name: string;
  category: BrandAssetCategory;
  tags: string[];
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif';
  sizeBytes: number;
  dataUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandAssetMetadata {
  name: string;
  category: BrandAssetCategory;
  tags: string[];
}

interface BrandAssetListResponse {
  assets: BrandAsset[];
  limit: number;
}

export function listBrandAssets(): Promise<BrandAssetListResponse> {
  return authenticatedRequest<BrandAssetListResponse>('/api/brand-assets');
}

export function createBrandAsset(
  metadata: BrandAssetMetadata,
  image: Pick<BrandAsset, 'dataUrl' | 'mimeType'>,
): Promise<BrandAsset> {
  const separatorIndex = image.dataUrl.indexOf(',');
  if (separatorIndex < 0) return Promise.reject(new Error('Invalid image data'));

  return authenticatedRequest<BrandAsset>('/api/brand-assets', {
    method: 'POST',
    body: JSON.stringify({
      ...metadata,
      mimeType: image.mimeType,
      data: image.dataUrl.slice(separatorIndex + 1),
    }),
  });
}

export function updateBrandAsset(
  assetId: string,
  metadata: BrandAssetMetadata,
): Promise<BrandAsset> {
  return authenticatedRequest<BrandAsset>(`/api/brand-assets/${assetId}`, {
    method: 'PUT',
    body: JSON.stringify(metadata),
  });
}

export function deleteBrandAsset(assetId: string): Promise<void> {
  return authenticatedRequest<void>(`/api/brand-assets/${assetId}`, { method: 'DELETE' });
}

