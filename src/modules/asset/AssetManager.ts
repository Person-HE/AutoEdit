// Asset 管理器
import type { Asset } from '../../types/core';
import type { AssetType, AssetMetadata, IAssetManager } from './AssetTypes';
import { v4 as uuidv4 } from 'uuid';

class AssetManager implements IAssetManager {
  private assets: Map<string, Asset> = new Map();
  private assetCache: Map<string, HTMLImageElement | HTMLVideoElement | HTMLAudioElement> = new Map();

  constructor(initialAssets?: Asset[]) {
    if (initialAssets) {
      initialAssets.forEach(asset => this.assets.set(asset.id, asset));
    }
  }

  async loadAsset(file: File): Promise<Asset> {
    const url = URL.createObjectURL(file);
    const type = this.detectFileType(file);
    const metadata = await this.extractMetadata(file, type);

    const id = uuidv4();
    const asset: Asset = {
      id,
      name: file.name,
      type,
      url,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      createdAt: Date.now(),
    };

    this.assets.set(id, asset);
    return asset;
  }

  async loadAssets(files: File[]): Promise<Asset[]> {
    const assets: Asset[] = [];
    for (const file of files) {
      try {
        const asset = await this.loadAsset(file);
        assets.push(asset);
      } catch (error) {
        console.error(`Failed to load asset: ${file.name}`, error);
      }
    }
    return assets;
  }

  async extractMetadata(file: File, type: AssetType): Promise<AssetMetadata> {
    const url = URL.createObjectURL(file);
    
    try {
      switch (type) {
        case 'image':
          return this.extractImageMetadata(url);
        case 'video':
          return this.extractVideoMetadata(url);
        case 'audio':
        case 'sound_effect':
          return this.extractAudioMetadata(url);
        default:
          throw new Error(`Unsupported asset type: ${type}`);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private extractImageMetadata(url: string): Promise<AssetMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  private extractVideoMetadata(url: string): Promise<AssetMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      };
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = url;
    });
  }

  private extractAudioMetadata(url: string): Promise<AssetMetadata> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.onloadedmetadata = () => {
        resolve({
          duration: audio.duration,
        });
      };
      audio.onerror = () => reject(new Error('Failed to load audio'));
      audio.src = url;
    });
  }

  revokeAssetUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  revokeAllUrls(assets: Asset[]): void {
    assets.forEach(asset => {
      if (asset.url.startsWith('blob:')) {
        URL.revokeObjectURL(asset.url);
      }
      if (asset.thumbnail && asset.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(asset.thumbnail);
      }
    });
  }

  async createThumbnail(asset: Asset): Promise<string> {
    if (asset.type === 'audio' || asset.type === 'sound_effect') {
      return '';
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    const thumbnailSize = { width: 320, height: 180 };
    canvas.width = thumbnailSize.width;
    canvas.height = thumbnailSize.height;

    if (asset.type === 'image') {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.drawImageToFit(ctx, img, thumbnailSize.width, thumbnailSize.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
        img.src = asset.url;
      });
    }

    if (asset.type === 'video') {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.onloadeddata = () => {
          video.currentTime = Math.min(1, video.duration * 0.1);
        };
        video.onseeked = () => {
          this.drawImageToFit(ctx, video, thumbnailSize.width, thumbnailSize.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
          video.src = '';
        };
        video.onerror = () => reject(new Error('Failed to load video for thumbnail'));
        video.src = asset.url;
      });
    }

    throw new Error(`Unsupported asset type for thumbnail: ${asset.type}`);
  }

  private drawImageToFit(
    ctx: CanvasRenderingContext2D,
    source: HTMLImageElement | HTMLVideoElement,
    targetWidth: number,
    targetHeight: number
  ): void {
    const sourceWidth = (source as HTMLImageElement).naturalWidth || (source as HTMLVideoElement).videoWidth;
    const sourceHeight = (source as HTMLImageElement).naturalHeight || (source as HTMLVideoElement).videoHeight;
    
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const x = (targetWidth - width) / 2;
    const y = (targetHeight - height) / 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(source, x, y, width, height);
  }

  getAssetCache(): Map<string, HTMLImageElement | HTMLVideoElement | HTMLAudioElement> {
    return this.assetCache;
  }

  addAsset(assetData: Omit<Asset, 'id' | 'createdAt'>): Asset {
    const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const asset: Asset = {
      ...assetData,
      id,
      createdAt: Date.now(),
    };

    this.assets.set(id, asset);
    return asset;
  }

  removeAsset(assetId: string): void {
    const asset = this.assets.get(assetId);
    if (asset) {
      this.revokeAssetUrl(asset.url);
      if (asset.thumbnail) {
        this.revokeAssetUrl(asset.thumbnail);
      }
      this.assetCache.delete(assetId);
    }
    this.assets.delete(assetId);
  }

  updateAsset(assetId: string, updates: Partial<Asset>): void {
    const asset = this.assets.get(assetId);
    if (asset) {
      Object.assign(asset, updates);
    }
  }

  upsertAsset(asset: Asset): void {
    this.assets.set(asset.id, asset);
  }

  getAsset(assetId: string): Asset | undefined {
    return this.assets.get(assetId);
  }

  getAllAssets(): Asset[] {
    return Array.from(this.assets.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getAssetsByType(type: Asset['type']): Asset[] {
    return this.getAllAssets().filter(a => a.type === type);
  }

  searchAssets(query: string): Asset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllAssets().filter(
      a => a.name.toLowerCase().includes(lowerQuery)
    );
  }

  private detectFileType(file: File): AssetType {
    const mimeType = file.type;
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) {
      if (file.name.includes('sfx') || file.name.includes('effect') || file.name.includes('sound')) {
        return 'sound_effect';
      }
      return 'audio';
    }
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

export default AssetManager;
export { AssetManager };
