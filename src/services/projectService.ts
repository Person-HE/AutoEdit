import { fileStorage } from './fileStorage';
import { Project, Asset } from '../types/core';
import { assetService } from './assetService';
import { v4 as uuidv4 } from 'uuid';

// 初始化默认项目
const createEmptyProject = (): Project => ({
  id: uuidv4(),
  name: `未命名项目_${new Date().toLocaleDateString()}`,
  width: 1920,
  height: 1080,
  duration: 30,
  fps: 60,
  tracks: [
    { id: 'track_v1', type: 'video', name: '视频轨道 1', visible: true, locked: false },
    { id: 'track_a1', type: 'audio', name: '音频轨道 1', visible: true, locked: false }
  ],
  clips: {},
  lastModified: Date.now()
});

export const projectService = {
  // 获取最近的项目和素材（用于恢复会话）
  getLastActiveProject: async (): Promise<{ project: Project; assets: Asset[] }> => {
    try {
      // 首先加载所有历史素材
      const allAssets = await assetService.loadAssets();
      console.log(`📂 Loaded ${allAssets.length} assets from storage`);
      
      // 获取最近的项目列表
      const recentProjects = await fileStorage.getRecentProjects();
      
      if (recentProjects.length > 0) {
        // 加载最近的项目
        const lastProject = await fileStorage.loadProject(recentProjects[0].id);
        if (lastProject) {
          return { project: lastProject.project, assets: allAssets };
        }
      }
      
      // 如果没有最近项目，创建新项目
      return { project: createEmptyProject(), assets: allAssets };
    } catch (e) {
      console.error('Load project failed:', e);
      return { project: createEmptyProject(), assets: [] };
    }
  },

  // 创建新项目
  createNewProject: async (project: Project): Promise<string> => {
    return await fileStorage.createNewProject(project);
  },

  // 删除项目
  deleteProject: async (projectId: string): Promise<void> => {
    await fileStorage.deleteProject(projectId);
  },

  // 重命名项目
  renameProject: async (projectId: string, newName: string): Promise<void> => {
    await fileStorage.renameProject(projectId, newName);
  },

  // 切换项目
  switchProject: async (projectId: string): Promise<{ project: Project; assets: Asset[] } | null> => {
    return await fileStorage.loadProject(projectId);
  },

  // 保存项目
  saveProject: async (project: Project, assets: any[] = []): Promise<void> => {
    try {
      const p = { ...project, lastModified: Date.now() };
      await fileStorage.saveProject(p, assets);
      console.log('✅ Project saved:', p.name);
    } catch (e) {
      console.error('❌ Save failed:', e);
      throw e;
    }
  },

  // 自动保存 (防抖通常在 UI 层或 Hook 处理，这里提供原子操作)
  autoSave: async (project: Project, assets: any[] = []): Promise<void> => {
    return projectService.saveProject(project, assets);
  },

  // 自动保存：getter 形式，每次保存读取最新状态（避免启动时快照过期）
  startAutoSave: (
    getProject: () => Project | null,
    getAssets: () => any[],
    callback?: () => void
  ): void => {
    fileStorage.startAutoSave(getProject, getAssets, callback);
  },

  // 停止自动保存
  stopAutoSave: (): void => {
    fileStorage.stopAutoSave();
  },

  // 打开项目文件
  openProject: async (): Promise<{ project: Project; assets: any[] } | null> => {
    return await fileStorage.openProjectFile();
  },

  // 获取最近项目列表
  getRecentProjects: async () => {
    return await fileStorage.getRecentProjects();
  },

  // 导出项目为文件
  exportProject: async (project: Project, assets: Asset[]): Promise<void> => {
    await fileStorage.exportProject(project, assets);
  }
};
