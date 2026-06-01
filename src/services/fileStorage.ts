// 文件系统存储服务 - 替代 IndexedDB
// 使用 Electron 的 IPC 或浏览器的 File System Access API

import { Project, Asset } from '../types/core';
import { generateShortId } from '../utils/idGenerator';

// 存储路径配置
const STORAGE_CONFIG = {
  projectsDir: 'projects',
  assetsDir: 'assets',
  autoSaveInterval: 30000, // 30秒自动保存
  fileExtension: '.nanoedit'
};

// 项目文件数据结构
interface ProjectFile {
  version: string;
  project: Project;
  assets: string[]; // 引用的素材ID列表
  lastModified: number;
  thumbnail?: string; // Base64 缩略图
}

// 素材元数据
interface AssetMetadata {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'sound_effect';
  originalName: string;
  size: number;
  createdAt: number;
  width?: number;
  height?: number;
  duration?: number;
  // 新增：存储路径信息
  storagePath?: string; // 存储的文件夹路径，如 "image/2024-01-15"
}

class FileStorageService {
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private currentProjectPath: string | null = null;
  private projectCache: Map<string, Project> = new Map();
  private assetCache: Map<string, Asset> = new Map();

  constructor() {
    // 不再清理数据，保留所有历史素材
    console.log('📂 FileStorageService initialized');
  }

  // 检查是否支持 File System Access API
  private isFileSystemAccessSupported(): boolean {
    return 'showSaveFilePicker' in window;
  }

  // 检查是否在 Electron 环境中
  private isElectron(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).electron !== 'undefined';
  }

  // ==================== 辅助方法 ====================

  // 获取当前日期字符串 (YYYY-MM-DD)
  private getCurrentDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  // 获取素材存储路径
  private getAssetStoragePath(type: string): string {
    const dateStr = this.getCurrentDateString();
    return `${type}/${dateStr}`;
  }

  // ==================== 项目操作 ====================

  // 创建新项目
  async createProject(project: Project): Promise<string> {
    const projectData: ProjectFile = {
      version: '1.0.0',
      project,
      assets: [],
      lastModified: Date.now()
    };

    if (this.isElectron()) {
      // Electron 环境：使用 IPC
      return await (window as any).electron.saveProject(project.id, projectData);
    } else if (this.isFileSystemAccessSupported()) {
      // 浏览器环境：使用 File System Access API
      return await this.saveProjectWithFilePicker(project.id, projectData);
    } else {
      // 降级方案：使用 LocalStorage + Download
      return await this.saveProjectWithDownload(project.id, projectData);
    }
  }

  // 保存项目
  async saveProject(project: Project, assets: Asset[] = []): Promise<void> {
    const projectData: ProjectFile = {
      version: '1.0.0',
      project,
      assets: assets.map(a => a.id),
      lastModified: Date.now()
    };

    // 更新缓存
    this.projectCache.set(project.id, project);
    assets.forEach(asset => this.assetCache.set(asset.id, asset));

    if (this.isElectron()) {
      await (window as any).electron.saveProject(project.id, projectData);
    } else if (this.currentProjectPath && this.isFileSystemAccessSupported()) {
      await this.writeFile(this.currentProjectPath, JSON.stringify(projectData, null, 2));
    } else {
      // 降级方案：保存到 LocalStorage
      localStorage.setItem(`project_${project.id}`, JSON.stringify(projectData));
    }

    console.log(`💾 Project saved: ${project.name}`);
  }

  // 加载项目
  async loadProject(projectId: string): Promise<{ project: Project; assets: Asset[] } | null> {
    // 先检查缓存
    if (this.projectCache.has(projectId)) {
      const project = this.projectCache.get(projectId)!;
      const assets = projectId === 'temp' 
        ? Array.from(this.assetCache.values())
        : [];
      return { project, assets };
    }

    let projectData: ProjectFile | null = null;

    if (this.isElectron()) {
      projectData = await (window as any).electron.loadProject(projectId);
    } else {
      // 从 LocalStorage 加载
      const stored = localStorage.getItem(`project_${projectId}`);
      if (stored) {
        projectData = JSON.parse(stored);
      }
    }

    if (!projectData) return null;

    if (!projectData.project.clips) {
      projectData.project.clips = {};
    }
    if (!projectData.project.tracks) {
      projectData.project.tracks = [];
    }

    this.projectCache.set(projectId, projectData.project);

    const assets: Asset[] = [];
    const assetIds: string[] = Array.isArray(projectData.assets) ? projectData.assets : [];
    for (const assetId of assetIds) {
      const asset = await this.loadAsset(assetId);
      if (asset) assets.push(asset);
    }

    return { project: projectData.project, assets };
  }

  // 打开项目文件选择器
  async openProjectFile(): Promise<{ project: Project; assets: Asset[] } | null> {
    if (!this.isFileSystemAccessSupported()) {
      // 降级方案：使用 input file
      return await this.openProjectWithFileInput();
    }

    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'NanoEdit Project',
          accept: { 'application/json': ['.nanoedit', '.json'] }
        }]
      });

      const file = await fileHandle.getFile();
      const content = await file.text();
      const projectData: ProjectFile = JSON.parse(content);

      this.currentProjectPath = fileHandle;
      this.projectCache.set(projectData.project.id, projectData.project);

      const assets: Asset[] = [];
      const assetIds: string[] = Array.isArray(projectData.assets) ? projectData.assets : [];
      for (const assetId of assetIds) {
        const asset = await this.loadAsset(assetId);
        if (asset) assets.push(asset);
      }

      return { project: projectData.project, assets };
    } catch (err) {
      console.error('Failed to open project:', err);
      return null;
    }
  }

  // 获取最近的项目列表
  async getRecentProjects(): Promise<{ id: string; name: string; lastModified: number; thumbnail?: string }[]> {
    const recent: { id: string; name: string; lastModified: number; thumbnail?: string }[] = [];

    // 从 LocalStorage 获取
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('project_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          if (data?.project?.id) {
            recent.push({
              id: data.project.id,
              name: data.project.name,
              lastModified: data.lastModified,
              thumbnail: data.thumbnail
            });
          }
        } catch (e) {
          console.error('Failed to parse project:', e);
        }
      }
    }

    return recent.sort((a, b) => b.lastModified - a.lastModified);
  }

  // 创建新项目
  async createNewProject(project: Project): Promise<string> {
    const projectData: ProjectFile = {
      version: '1.0.0',
      project,
      assets: [],
      lastModified: Date.now()
    };

    localStorage.setItem(`project_${project.id}`, JSON.stringify(projectData));
    console.log(`✅ Created new project: ${project.name}`);
    return project.id;
  }

  // 删除项目
  async deleteProject(projectId: string): Promise<void> {
    localStorage.removeItem(`project_${projectId}`);
    console.log(`🗑️ Deleted project: ${projectId}`);
  }

  // 重命名项目
  async renameProject(projectId: string, newName: string): Promise<void> {
    const stored = localStorage.getItem(`project_${projectId}`);
    if (!stored) {
      throw new Error('Project not found');
    }

    const projectData: ProjectFile = JSON.parse(stored);
    projectData.project.name = newName;
    projectData.lastModified = Date.now();

    localStorage.setItem(`project_${projectId}`, JSON.stringify(projectData));
    console.log(`✏️ Renamed project to: ${newName}`);
  }

  // 导出项目为文件
  async exportProject(project: Project, assets: Asset[]): Promise<void> {
    const projectData: ProjectFile = {
      version: '1.0.0',
      project,
      assets: assets.map(a => a.id),
      lastModified: Date.now()
    };

    if (this.isElectron()) {
      await (window as any).electron.saveProject(project.id, projectData);
    } else if (this.isFileSystemAccessSupported()) {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `${project.name}${STORAGE_CONFIG.fileExtension}`,
        types: [{
          description: 'NanoEdit Project',
          accept: { 'application/json': ['.nanoedit'] }
        }]
      });

      await this.writeFile(fileHandle, JSON.stringify(projectData, null, 2));
      console.log(`📦 Exported project: ${project.name}`);
    } else {
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}${STORAGE_CONFIG.fileExtension}`;
      a.click();
      
      URL.revokeObjectURL(url);
      console.log(`📦 Exported project: ${project.name}`);
    }
  }

  // ==================== 素材操作 ====================

  // 保存素材
  async saveAsset(file: File): Promise<Asset> {
    const id = generateShortId('asset_');
    
    // 确定素材类型
    const assetType: Asset['type'] = file.type.startsWith('video') ? 'video' : 
            file.type.startsWith('image') ? 'image' : 
            file.type.startsWith('audio') ? 'audio' : 'sound_effect';
    
    // 获取存储路径（按类型和日期分类）
    const storagePath = this.getAssetStoragePath(assetType);
    
    const asset: Asset = {
      id,
      name: file.name,
      type: assetType,
      url: URL.createObjectURL(file),
      createdAt: Date.now(),
      duration: file.type.startsWith('video') ? 10 : 5, // 默认值
      width: 1920,
      height: 1080
    };

    // 保存素材元数据
    const metadata: AssetMetadata = {
      id,
      name: file.name,
      type: asset.type,
      originalName: file.name,
      size: file.size,
      createdAt: Date.now(),
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      storagePath // 记录存储路径
    };

    if (this.isElectron()) {
      // Electron：保存到用户数据目录，按类型和日期组织
      await (window as any).electron.saveAsset(id, file, metadata, storagePath);
    } else {
      // 浏览器：保存到 LocalStorage，使用新的键名格式包含路径信息
      const metaKey = `asset_meta_${storagePath.replace(/\//g, '_')}_${id}`;
      localStorage.setItem(metaKey, JSON.stringify(metadata));
      
      // 同时保存一个索引，用于快速查找
      const indexKey = `asset_index_${id}`;
      localStorage.setItem(indexKey, JSON.stringify({ path: storagePath, id }));
      
      // 将文件内容转为 Base64 存储（仅小文件）
      if (file.size < 5 * 1024 * 1024) { // 小于 5MB
        const base64 = await this.fileToBase64(file);
        const dataKey = `asset_data_${storagePath.replace(/\//g, '_')}_${id}`;
        localStorage.setItem(dataKey, base64);
      }
    }

    this.assetCache.set(id, asset);
    console.log(`✅ Asset saved: ${file.name} -> ${storagePath}/${id}`);
    return asset;
  }

  // 加载素材
  async loadAsset(assetId: string): Promise<Asset | null> {
    // 检查缓存
    if (this.assetCache.has(assetId)) {
      return this.assetCache.get(assetId)!;
    }

    let asset: Asset | null = null;

    if (this.isElectron()) {
      asset = await (window as any).electron.loadAsset(assetId);
    } else {
      // 首先查找索引
      const indexKey = `asset_index_${assetId}`;
      const indexStr = localStorage.getItem(indexKey);
      
      if (indexStr) {
        // 使用索引找到正确的路径
        const index = JSON.parse(indexStr);
        const pathPrefix = index.path.replace(/\//g, '_');
        const metaStr = localStorage.getItem(`asset_meta_${pathPrefix}_${assetId}`);
        const dataStr = localStorage.getItem(`asset_data_${pathPrefix}_${assetId}`);

        if (metaStr) {
          const metadata: AssetMetadata = JSON.parse(metaStr);
          
          let url = '';
          if (dataStr) {
            // 从 Base64 恢复
            url = dataStr;
          }

          asset = {
            id: metadata.id,
            name: metadata.name,
            type: metadata.type,
            url,
            createdAt: metadata.createdAt,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height
          };
        }
      } else {
        // 兼容旧格式：尝试直接查找
        const legacyMetaStr = localStorage.getItem(`asset_meta_${assetId}`);
        const legacyDataStr = localStorage.getItem(`asset_data_${assetId}`);
        
        if (legacyMetaStr) {
          const metadata: AssetMetadata = JSON.parse(legacyMetaStr);
          
          let url = '';
          if (legacyDataStr) {
            url = legacyDataStr;
          }

          asset = {
            id: metadata.id,
            name: metadata.name,
            type: metadata.type,
            url,
            createdAt: metadata.createdAt,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height
          };
          
          // 迁移到新格式
          const storagePath = metadata.storagePath || this.getAssetStoragePath(metadata.type);
          const pathPrefix = storagePath.replace(/\//g, '_');
          localStorage.setItem(`asset_meta_${pathPrefix}_${assetId}`, JSON.stringify({ ...metadata, storagePath }));
          localStorage.setItem(`asset_index_${assetId}`, JSON.stringify({ path: storagePath, id: assetId }));
          if (legacyDataStr) {
            localStorage.setItem(`asset_data_${pathPrefix}_${assetId}`, legacyDataStr);
          }
          console.log(`🔄 Migrated asset to new format: ${assetId}`);
        }
      }
    }

    if (asset) {
      this.assetCache.set(assetId, asset);
    }

    return asset;
  }

  // 加载所有素材
  async loadAllAssets(): Promise<Asset[]> {
    const assets: Asset[] = [];
    const seenIds = new Set<string>();

    console.log('📂 Loading all assets from localStorage...');

    // 首先通过索引加载
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('asset_index_')) {
        try {
          const index = JSON.parse(localStorage.getItem(key)!);
          const assetId = index.id;
          
          // 跳过重复的 ID
          if (seenIds.has(assetId)) {
            continue;
          }
          
          const asset = await this.loadAsset(assetId);
          if (asset) {
            assets.push(asset);
            seenIds.add(assetId);
          }
        } catch (e) {
          console.error('Failed to load asset from index:', e);
        }
      }
    }

    // 兼容旧格式：扫描所有 asset_meta_ 键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // 匹配旧格式的键（不包含路径的）
      if (key?.startsWith('asset_meta_') && !key.includes('_image_') && !key.includes('_video_') && !key.includes('_audio_') && !key.includes('_sound_effect_')) {
        try {
          const assetId = key.replace('asset_meta_', '');
          
          // 跳过已加载的
          if (seenIds.has(assetId)) {
            continue;
          }
          
          const asset = await this.loadAsset(assetId);
          if (asset) {
            assets.push(asset);
            seenIds.add(assetId);
          }
        } catch (e) {
          console.error('Failed to load legacy asset:', e);
        }
      }
    }

    console.log(`📊 Total assets loaded: ${assets.length}`);
    return assets;
  }

  // 按日期获取素材
  async getAssetsByDate(date: string): Promise<Asset[]> {
    const allAssets = await this.loadAllAssets();
    return allAssets.filter(asset => {
      const assetDate = new Date(asset.createdAt);
      const dateStr = `${assetDate.getFullYear()}-${String(assetDate.getMonth() + 1).padStart(2, '0')}-${String(assetDate.getDate()).padStart(2, '0')}`;
      return dateStr === date;
    });
  }

  // 按类型获取素材
  async getAssetsByType(type: Asset['type']): Promise<Asset[]> {
    const allAssets = await this.loadAllAssets();
    return allAssets.filter(asset => asset.type === type);
  }

  // 删除素材
  async deleteAsset(assetId: string): Promise<boolean> {
    // 从缓存中移除
    this.assetCache.delete(assetId);

    // 从 localStorage 中移除
    const indexKey = `asset_index_${assetId}`;
    const indexStr = localStorage.getItem(indexKey);

    if (indexStr) {
      const index = JSON.parse(indexStr);
      const pathPrefix = index.path.replace(/\//g, '_');
      localStorage.removeItem(`asset_meta_${pathPrefix}_${assetId}`);
      localStorage.removeItem(`asset_data_${pathPrefix}_${assetId}`);
      localStorage.removeItem(indexKey);
    } else {
      // 兼容旧格式
      localStorage.removeItem(`asset_meta_${assetId}`);
      localStorage.removeItem(`asset_data_${assetId}`);
    }

    console.log(`🗑️ Deleted asset: ${assetId}`);
    return true;
  }

  // ==================== 自动保存 ====================

  // 启动自动保存
  startAutoSave(project: Project, assets: Asset[], callback?: () => void): void {
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(async () => {
      await this.saveProject(project, assets);
      callback?.();
    }, STORAGE_CONFIG.autoSaveInterval);

    console.log('🔄 Auto-save started');
  }

  // 停止自动保存
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('🛑 Auto-save stopped');
    }
  }

  // 立即保存
  async saveNow(project: Project, assets: Asset[]): Promise<void> {
    await this.saveProject(project, assets);
  }

  // 清除所有数据
  clearAllData(): void {
    this.projectCache.clear();
    this.assetCache.clear();
    localStorage.clear();
    console.log('🗑️ All data cleared');
  }

  // ==================== 私有方法 ====================

  // 使用 File System Access API 保存项目
  private async saveProjectWithFilePicker(projectId: string, data: ProjectFile): Promise<string> {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `${data.project.name}${STORAGE_CONFIG.fileExtension}`,
        types: [{
          description: 'NanoEdit Project',
          accept: { 'application/json': ['.nanoedit'] }
        }]
      });

      await this.writeFile(fileHandle, JSON.stringify(data, null, 2));
      this.currentProjectPath = fileHandle;
      return projectId;
    } catch (err) {
      console.error('Failed to save project:', err);
      throw err;
    }
  }

  // 使用 Download 方式保存（降级方案）
  private async saveProjectWithDownload(projectId: string, data: ProjectFile): Promise<string> {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.project.name}${STORAGE_CONFIG.fileExtension}`;
    a.click();
    
    URL.revokeObjectURL(url);
    return projectId;
  }

  // 使用 File Input 打开项目（降级方案）
  private async openProjectWithFileInput(): Promise<{ project: Project; assets: Asset[] } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.nanoedit,.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const content = await file.text();
          const projectData: ProjectFile = JSON.parse(content);
          
          this.projectCache.set(projectData.project.id, projectData.project);

          const assets: Asset[] = [];
          const assetIds: string[] = Array.isArray(projectData.assets) ? projectData.assets : [];
          for (const assetId of assetIds) {
            const asset = await this.loadAsset(assetId);
            if (asset) assets.push(asset);
          }

          resolve({ project: projectData.project, assets });
        } catch (err) {
          console.error('Failed to parse project:', err);
          resolve(null);
        }
      };

      input.click();
    });
  }

  // 写入文件
  private async writeFile(fileHandle: any, content: string): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  // 文件转 Base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const fileStorage = new FileStorageService();
