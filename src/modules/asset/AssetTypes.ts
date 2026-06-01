// Asset 类型定义
import type { Asset } from '../../types/core';

export type AssetType = 'video' | 'image' | 'audio' | 'sound_effect';

export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
}

export type AssetStatus = 'loading' | 'ready' | 'error';

export interface AssetWithStatus extends Asset {
  status: AssetStatus;
  error?: string;
}

export enum AssetCategory {
  VIDEO = 'video',
  IMAGE = 'image',
  AUDIO = 'audio',
  SOUND_EFFECT = 'sound_effect'
}

export function getAssetCategory(asset: Asset | AssetWithStatus): AssetCategory {
  switch (asset.type) {
    case 'video':
      return AssetCategory.VIDEO;
    case 'image':
      return AssetCategory.IMAGE;
    case 'audio':
      return AssetCategory.AUDIO;
    case 'sound_effect':
      return AssetCategory.SOUND_EFFECT;
    default:
      throw new Error(`Unknown asset type: ${(asset as Asset).type}`);
  }
}

export interface AssetOperation {
  type: 'add' | 'remove' | 'update';
  payload: {
    assetId?: string;
    asset?: Partial<Asset>;
  };
}

export interface AssetState {
  assets: Asset[];
  fixedAssets: Asset[];
  fixedFolderPath: string | null;
  loadedAssets: Map<string, HTMLImageElement | HTMLVideoElement | HTMLAudioElement>;
  selectedAssetId: string | null;
  isLoading: boolean;
}

export interface IAssetManager {
  loadAsset(file: File): Promise<Asset>;
  loadAssets(files: File[]): Promise<Asset[]>;
  extractMetadata(file: File, type: AssetType): Promise<AssetMetadata>;
  revokeAssetUrl(url: string): void;
  revokeAllUrls(assets: Asset[]): void;
  createThumbnail(asset: Asset): Promise<string>;
  getAssetCache(): Map<string, HTMLImageElement | HTMLVideoElement | HTMLAudioElement>;
  addAsset(asset: Omit<Asset, 'id' | 'createdAt'>): Asset;
  removeAsset(assetId: string): void;
  updateAsset(assetId: string, updates: Partial<Asset>): void;
  upsertAsset(asset: Asset): void;
  getAsset(assetId: string): Asset | undefined;
  getAllAssets(): Asset[];
  getAssetsByType(type: Asset['type']): Asset[];
  searchAssets(query: string): Asset[];
}

export interface UploadConfig {
  maxSize?: number;
  acceptedTypes?: string[];
  generateThumbnail?: boolean;
}
