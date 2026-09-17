import { create } from 'zustand';
import type { Asset } from '../../types/core';
import type { AssetState } from './AssetTypes';
import AssetManager from './AssetManager';
import { computePeaksFromUrl } from '../../engine/audio/peaks';

const FIXED_FOLDER_KEY = 'fixed_asset_folder_path';

export interface AssetStore extends AssetState {
  manager: AssetManager;
  addAssets: (assets: Asset[]) => void;
  removeAsset: (assetId: string) => void;
  getAssetById: (assetId: string) => Asset | undefined;
  getAssetsByType: (type: Asset['type']) => Asset[];
  clearAll: () => void;
  loadAndAddAssets: (files: File[]) => Promise<Asset[]>;
  setSelectedAsset: (assetId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAssets: (assets: Asset[]) => void;
  setFixedAssets: (assets: Asset[]) => void;
  setFixedFolderPath: (path: string | null) => void;
  getFixedFolderPath: () => string | null;
  loadFixedFolderAssets: (dirHandle: FileSystemDirectoryHandle) => Promise<Asset[]>;
  removeImportedAsset: (assetId: string) => void;
}

const SUPPORTED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg',
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
  '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a',
]);

function getAssetTypeFromFileName(fileName: string): Asset['type'] | null {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'].includes(ext)) return 'audio';
  return null;
}

function isSupportedFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.has(ext);
}

const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  fixedAssets: [],
  fixedFolderPath: localStorage.getItem(FIXED_FOLDER_KEY),
  loadedAssets: new Map(),
  selectedAssetId: null,
  isLoading: false,
  manager: new AssetManager(),

  addAssets: (newAssets) => set((state) => ({
    assets: [...state.assets, ...newAssets]
  })),

  removeAsset: (assetId) => {
    const { manager, assets } = get();
    const asset = assets.find(a => a.id === assetId);
    if (asset && asset.source === 'fixed') return;
    manager.removeAsset(assetId);
    set(state => {
      const newAssets = state.assets.filter(a => a.id !== assetId);
      const newLoadedAssets = new Map(state.loadedAssets);
      newLoadedAssets.delete(assetId);
      return {
        assets: newAssets,
        loadedAssets: newLoadedAssets,
        selectedAssetId: state.selectedAssetId === assetId ? null : state.selectedAssetId
      };
    });
  },

  removeImportedAsset: (assetId) => {
    const { manager } = get();
    manager.removeAsset(assetId);
    set(state => {
      const newAssets = state.assets.filter(a => a.id !== assetId);
      const newLoadedAssets = new Map(state.loadedAssets);
      newLoadedAssets.delete(assetId);
      return {
        assets: newAssets,
        loadedAssets: newLoadedAssets,
        selectedAssetId: state.selectedAssetId === assetId ? null : state.selectedAssetId
      };
    });
  },

  getAssetById: (assetId) => {
    const { manager } = get();
    return manager.getAsset(assetId);
  },

  getAssetsByType: (type) => {
    const { manager } = get();
    return manager.getAssetsByType(type);
  },

  clearAll: () => {
    const { manager, assets } = get();
    manager.revokeAllUrls(assets);
    set({
      assets: [],
      fixedAssets: [],
      loadedAssets: new Map(),
      selectedAssetId: null,
    });
  },

  loadAndAddAssets: async (files) => {
    const { manager } = get();
    set({ isLoading: true });

    try {
      const assets = await manager.loadAssets(files);

      const thumbnailPromises = assets.map(async (asset) => {
        if (asset.type === 'image' || asset.type === 'video') {
          try {
            const thumbnail = await manager.createThumbnail(asset);
            return { ...asset, thumbnail };
          } catch (error) {
            console.error(`Failed to create thumbnail for ${asset.name}:`, error);
            return asset;
          }
        }
        return asset;
      });

      const assetsWithThumbnails = await Promise.all(thumbnailPromises);

      set(state => ({
        assets: [...state.assets, ...assetsWithThumbnails],
        isLoading: false
      }));

      // 异步补算音频波形峰值（不阻塞导入）
      for (const asset of assetsWithThumbnails) {
        if (asset.type === 'audio' && asset.url && !asset.peaks) {
          computePeaksFromUrl(asset.url).then(peaks => {
            if (!peaks) return;
            asset.peaks = peaks;
            get().manager.upsertAsset(asset);
            set(state => ({
              assets: state.assets.map(a => a.id === asset.id ? { ...a, peaks } : a)
            }));
          });
        }
      }

      return assetsWithThumbnails;
    } catch (error) {
      console.error('Failed to load assets:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  setSelectedAsset: (assetId) => set({ selectedAssetId: assetId }),
  setLoading: (isLoading) => set({ isLoading }),

  setAssets: (newAssets) => {
    const { manager } = get();
    for (const a of newAssets) {
      manager.upsertAsset(a);
    }
    set({ assets: newAssets });
  },

  setFixedAssets: (assets) => set({ fixedAssets: assets }),

  setFixedFolderPath: (path) => {
    if (path) {
      localStorage.setItem(FIXED_FOLDER_KEY, path);
    } else {
      localStorage.removeItem(FIXED_FOLDER_KEY);
    }
    set({ fixedFolderPath: path });
  },

  getFixedFolderPath: () => {
    return localStorage.getItem(FIXED_FOLDER_KEY);
  },

  loadFixedFolderAssets: async (dirHandle: FileSystemDirectoryHandle) => {
    set({ isLoading: true });
    const assets: Asset[] = [];

    try {
      const folderName = dirHandle.name;

      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file' && isSupportedFile(entry.name)) {
          try {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            const assetType = getAssetTypeFromFileName(file.name);
            if (!assetType) continue;

            const url = URL.createObjectURL(file);
            const id = `fixed_${folderName}_${file.name}_${file.size}_${file.lastModified}`;

            const asset: Asset = {
              id,
              name: file.name,
              type: assetType,
              url,
              createdAt: file.lastModified,
              source: 'fixed',
              folderPath: folderName,
            };

            if (assetType === 'image') {
              try {
                const img = new Image();
                await new Promise<void>((resolve) => {
                  img.onload = () => {
                    asset.width = img.naturalWidth;
                    asset.height = img.naturalHeight;
                    resolve();
                  };
                  img.onerror = () => resolve();
                  img.src = url;
                });
              } catch {}
            } else if (assetType === 'video') {
              try {
                const video = document.createElement('video');
                await new Promise<void>((resolve) => {
                  video.onloadedmetadata = () => {
                    asset.width = video.videoWidth;
                    asset.height = video.videoHeight;
                    asset.duration = video.duration;
                    resolve();
                  };
                  video.onerror = () => resolve();
                  video.src = url;
                });
              } catch {}
            } else if (assetType === 'audio') {
              try {
                const audio = document.createElement('audio');
                await new Promise<void>((resolve) => {
                  audio.onloadedmetadata = () => {
                    asset.duration = audio.duration;
                    resolve();
                  };
                  audio.onerror = () => resolve();
                  audio.src = url;
                });
              } catch {}
              computePeaksFromUrl(url).then(peaks => { if (peaks) asset.peaks = peaks; });
            }

            assets.push(asset);
          } catch (err) {
            console.error(`Failed to load fixed asset: ${entry.name}`, err);
          }
        }
      }

      set({ fixedAssets: assets, isLoading: false });
      return assets;
    } catch (error) {
      console.error('Failed to scan fixed folder:', error);
      set({ isLoading: false });
      return [];
    }
  },
}));

export default useAssetStore;
export { useAssetStore };
