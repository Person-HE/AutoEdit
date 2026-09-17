// 项目/素材持久化服务
// 浏览器：IndexedDB(Dexie)；Electron：IPC；导出仍走文件选择器/下载

import Dexie from 'dexie';
import type { Table } from 'dexie';
import { Project, Asset } from '../types/core';
import { generateShortId } from '../utils/idGenerator';

const STORAGE_CONFIG = {
  autoSaveIntervalMs: 30000, // 兜底周期保存
  fileExtension: '.nanoedit',
};

interface ProjectFile {
  version: string;
  project: Project;
  assets: string[];
  lastModified: number;
  thumbnail?: string;
}

interface AssetRecord {
  id: string;
  metadata: {
    name: string;
    type: Asset['type'];
    size: number;
    createdAt: number;
    width?: number;
    height?: number;
    duration?: number;
  };
  blob?: Blob;
}

class NanoEditDB extends Dexie {
  projects!: Table<ProjectFile, string>;
  assets!: Table<AssetRecord, string>;

  constructor() {
    super('nanoedit-db');
    this.version(1).stores({
      projects: 'id, lastModified',
      assets: 'id',
    });
  }
}

class FileStorageService {
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private currentProjectPath: any = null;
  private projectCache: Map<string, Project> = new Map();
  private assetCache: Map<string, Asset> = new Map();
  private db: NanoEditDB | null = null;
  private dbReady: Promise<boolean> = Promise.resolve(false);
  private memoryProjects: Map<string, ProjectFile> = new Map();
  private memoryAssets: Map<string, AssetRecord> = new Map();

  constructor() {
    this.dbReady = this.initDb();
  }

  private async initDb(): Promise<boolean> {
    try {
      this.db = new NanoEditDB();
      await this.db.open();
      return true;
    } catch (err) {
      console.warn('IndexedDB unavailable, using in-memory storage fallback', err);
      this.db = null;
      return false;
    }
  }

  private async withDb<T>(fn: (db: NanoEditDB) => Promise<T>, fallbackMem: () => T): Promise<T> {
    const ok = (await this.dbReady) && !!this.db;
    if (!ok) return fallbackMem();
    try {
      return await fn(this.db!);
    } catch (err) {
      console.error('IndexedDB op failed:', err);
      return fallbackMem();
    }
  }

  private isElectron(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).electron !== 'undefined';
  }

  private isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  }

  // ==================== 项目操作 ====================

  async createNewProject(project: Project): Promise<string> {
    const data: ProjectFile = { version: '1.0.0', project, assets: [], lastModified: Date.now() };
    await this.putProject(data);
    return project.id;
  }

  /** 与 createNewProject 同义的历史别名 */
  async createProject(project: Project): Promise<string> {
    return this.createNewProject(project);
  }

  private async putProject(data: ProjectFile): Promise<void> {
    if (this.isElectron()) {
      await (window as any).electron.saveProject(data.project.id, data);
      return;
    }
    await this.withDb(
      async db => { await db.projects.put(data); },
      () => { this.memoryProjects.set(data.project.id, data); }
    );
  }

  async saveProject(project: Project, assets: Asset[] = []): Promise<void> {
    const data: ProjectFile = {
      version: '1.0.0',
      project,
      assets: assets.map(a => a.id),
      lastModified: Date.now(),
    };

    this.projectCache.set(project.id, project);

    // Electron 环境素材由主进程管理；浏览器环境直接持久化素材表
    await this.putProject(data);
    if (!this.isElectron()) {
      const records = assets.map(a => ({
        id: a.id,
        metadata: {
          name: a.name, type: a.type, size: 0, createdAt: a.createdAt,
          width: a.width, height: a.height, duration: a.duration,
        },
      }));
      await this.withDb<void>(async db => { await db.assets.bulkPut(records); }, () => {
        records.forEach(r => this.memoryAssets.set(r.id, r));
      });
    }
  }

  async loadProject(projectId: string): Promise<{ project: Project; assets: Asset[] } | null> {
    if (this.projectCache.has(projectId)) {
      const cached = this.projectCache.get(projectId)!;
      // temp 项目素材从缓存取；正式项目素材按记录加载
      let cachedAssets: Asset[] = [];
      if (projectId === 'temp') {
        cachedAssets = Array.from(this.assetCache.values());
      }
      return { project: cached, assets: cachedAssets };
    }

    let projectData: ProjectFile | null = null;

    if (this.isElectron()) {
      projectData = await (window as any).electron.loadProject(projectId);
    } else {
      projectData = await this.withDb(
        db => db.projects.get(projectId) ?? null,
        () => this.memoryProjects.get(projectId) ?? null
      );
    }

    if (!projectData?.project) return null;

    projectData.project.clips ??= {};
    projectData.project.tracks ??= [];
    this.projectCache.set(projectId, projectData.project);

    const assets: Asset[] = [];
    const ids = Array.isArray(projectData.assets) ? projectData.assets : [];
    for (const id of ids) {
      const a = await this.loadAsset(id);
      if (a) assets.push(a);
    }
    return { project: projectData.project, assets };
  }

  async getRecentProjects(): Promise<{ id: string; name: string; lastModified: number; thumbnail?: string }[]> {
    const all: ProjectFile[] = await this.withDb(
      db => db.projects.toArray(),
      () => [...this.memoryProjects.values()]
    );
    return all
      .filter(p => p?.project?.id)
      .map(p => ({ id: p.project.id, name: p.project.name, lastModified: p.lastModified, thumbnail: p.thumbnail }))
      .sort((a, b) => b.lastModified - a.lastModified);
  }

  async deleteProject(projectId: string): Promise<void> {
    this.projectCache.delete(projectId);
    if (this.isElectron()) {
      await (window as any).electron.deleteProject?.(projectId);
      return;
    }
    await this.withDb(
      async db => { await db.projects.delete(projectId); },
      () => { this.memoryProjects.delete(projectId); }
    );
  }

  async renameProject(projectId: string, newName: string): Promise<void> {
    const loaded = await this.withDb(
      db => db.projects.get(projectId) ?? null,
      () => this.memoryProjects.get(projectId) ?? null
    );
    if (!loaded) throw new Error('Project not found');
    loaded.project.name = newName;
    loaded.lastModified = Date.now();
    await this.putProject(loaded);
  }

  async openProjectFile(): Promise<{ project: Project; assets: Asset[] } | null> {
    if (!this.isFileSystemAccessSupported()) {
      return this.openProjectWithFileInput();
    }
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'NanoEdit Project', accept: { 'application/json': ['.nanoedit', '.json'] } }],
      });
      const content = await (await fileHandle.getFile()).text();
      const projectData: ProjectFile = JSON.parse(content);
      this.currentProjectPath = fileHandle;
      this.projectCache.set(projectData.project.id, projectData.project);

      const assets: Asset[] = [];
      for (const id of (projectData.assets ?? [])) {
        const a = await this.loadAsset(id);
        if (a) assets.push(a);
      }
      return { project: projectData.project, assets };
    } catch (err) {
      console.error('Failed to open project:', err);
      return null;
    }
  }

  async exportProject(project: Project, _assets: Asset[]): Promise<void> {
    const data: ProjectFile = { version: '1.0.0', project, assets: [], lastModified: Date.now() };

    if (this.isFileSystemAccessSupported()) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${project.name}${STORAGE_CONFIG.fileExtension}`,
        types: [{ description: 'NanoEdit Project', accept: { 'application/json': ['.nanoedit'] } }],
      });
      await this.writeFile(handle, JSON.stringify(data, null, 2));
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}${STORAGE_CONFIG.fileExtension}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // ==================== 素材操作 ====================

  async saveAsset(file: File): Promise<Asset> {
    const id = generateShortId('asset_');
    const assetType: Asset['type'] =
      file.type.startsWith('video') ? 'video' :
      file.type.startsWith('image') ? 'image' :
      file.type.startsWith('audio') ? 'audio' : 'sound_effect';

    const asset: Asset = {
      id,
      name: file.name,
      type: assetType,
      url: URL.createObjectURL(file),
      createdAt: Date.now(),
    };

    const record: AssetRecord = {
      id,
      metadata: { name: file.name, type: assetType, size: file.size, createdAt: asset.createdAt },
      blob: file,
    };

    if (this.isElectron()) {
      await (window as any).electron.saveAsset(id, file, record.metadata, '');
    } else {
      await this.withDb(
        async db => { await db.assets.put(record); },
        () => { this.memoryAssets.set(id, record); }
      );
    }

    this.assetCache.set(id, asset);
    return asset;
  }

  async loadAsset(assetId: string): Promise<Asset | null> {
    if (this.assetCache.has(assetId)) return this.assetCache.get(assetId)!;

    let asset: Asset | null = null;

    if (this.isElectron()) {
      asset = await (window as any).electron.loadAsset(assetId);
    } else {
      const record = await this.withDb(
        db => db.assets.get(assetId) ?? null,
        () => this.memoryAssets.get(assetId) ?? null
      );
      if (record) {
        const url = record.blob ? URL.createObjectURL(record.blob) : '';
        asset = {
          id: record.id,
          name: record.metadata.name,
          type: record.metadata.type,
          url,
          createdAt: record.metadata.createdAt,
          duration: record.metadata.duration,
          width: record.metadata.width,
          height: record.metadata.height,
        };
      }
    }

    if (asset) this.assetCache.set(assetId, asset);
    return asset;
  }

  async loadAllAssets(): Promise<Asset[]> {
    const records = await this.withDb(
      db => db.assets.toArray(),
      () => [...this.memoryAssets.values()]
    );

    const result: Asset[] = [];
    for (const r of records) {
      if (r.blob && !this.assetCache.has(r.id)) {
        const asset: Asset = {
          id: r.id,
          name: r.metadata.name,
          type: r.metadata.type,
          url: URL.createObjectURL(r.blob),
          createdAt: r.metadata.createdAt,
          duration: r.metadata.duration,
          width: r.metadata.width,
          height: r.metadata.height,
        };
        this.assetCache.set(r.id, asset);
        result.push(asset);
      } else if (this.assetCache.has(r.id)) {
        result.push(this.assetCache.get(r.id)!);
      }
    }
    return result;
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    this.assetCache.delete(assetId);
    if (this.isElectron()) {
      await (window as any).electron.deleteAsset?.(assetId);
      return true;
    }
    await this.withDb(
      async db => { await db.assets.delete(assetId); },
      () => { this.memoryAssets.delete(assetId); }
    );
    return true;
  }

  // ==================== 自动保存 ====================

  /**
   * 兜底周期保存。getter 每次触发时读取最新状态（修复旧实现启动时捕获快照导致的过期保存）。
   * 常规路径由 store 订阅 + 防抖调用 saveProject 完成。
   */
  startAutoSave(
    getProject: () => Project | null,
    getAssets: () => Asset[],
    onSaved?: () => void
  ): void {
    this.stopAutoSave();

    let lastSavedRef: Project | null = null;
    this.autoSaveTimer = setInterval(async () => {
      const project = getProject();
      if (!project || project === lastSavedRef) return;
      lastSavedRef = project;
      await this.saveProject(project, getAssets());
      onSaved?.();
    }, STORAGE_CONFIG.autoSaveIntervalMs);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  async saveNow(project: Project, assets: Asset[]): Promise<void> {
    await this.saveProject(project, assets);
  }

  clearAllData(): void {
    this.projectCache.clear();
    this.assetCache.clear();
    this.memoryProjects.clear();
    this.memoryAssets.clear();
    this.dbReady.then(ok => { if (ok && this.db) { this.db.projects.clear(); this.db.assets.clear(); } });
  }

  // ==================== 私有 ====================

  private async openProjectWithFileInput(): Promise<{ project: Project; assets: Asset[] } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.nanoedit,.json';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        try {
          const projectData: ProjectFile = JSON.parse(await file.text());
          projectData.project.clips ??= {};
          this.projectCache.set(projectData.project.id, projectData.project);
          resolve({ project: projectData.project, assets: [] });
        } catch (err) {
          console.error('Failed to parse project:', err);
          resolve(null);
        }
      };
      input.click();
    });
  }

  private async writeFile(fileHandle: any, content: string): Promise<void> {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
}

export const fileStorage = new FileStorageService();
