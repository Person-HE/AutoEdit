// Store 统一导出入口
// 提供所有 store 的统一访问点和便捷的组合 Hook

import { useProjectStore } from './useProjectStore';
import { useTrackStore } from '../modules/track/useTrackStore';
import { useAssetStore } from '../modules/asset/useAssetStore';
import { usePlayerStore } from './usePlayerStore';
import { useUIStore } from './useUIStore';

// 重新导出 store
export { useProjectStore };
export { useTrackStore };
export { useAssetStore };
export { usePlayerStore };
export { useUIStore };

// 类型导出
export type { ProjectState } from './useProjectStore';
export type { TrackStore } from '../modules/track/useTrackStore';
export type { AssetStore } from '../modules/asset/useAssetStore';
export type { PlayerState } from './usePlayerStore';
export type { UIStore } from './useUIStore';

/**
 * 便捷组合 Hook - 获取编辑器完整状态
 *
 * 使用示例：
 * ```tsx
 * const { project, assets, tracks, player, ui } = useEditorState();
 * ```
 *
 * 适用场景：
 * - 需要同时访问多个 store 的组件
 * - 避免在组件中多次调用多个 useXxxStore
 * - 编辑器主页面、时间轴等复杂组件
 */
export function useEditorState() {
  const project = useProjectStore(s => s.project);
  const assets = useAssetStore(s => s.assets);
  const tracks = useTrackStore(s => s.tracks);
  const player = usePlayerStore();
  const ui = useUIStore();

  return {
    project,
    assets,
    tracks,
    player,
    ui
  };
}

/**
 * 项目操作便捷 Hook
 *
 * 专门用于项目级操作的组合 Hook
 */
export function useProjectActions() {
  const initApp = useProjectStore(s => s.initApp);
  const createNewProject = useProjectStore(s => s.createNewProject);
  const deleteProject = useProjectStore(s => s.deleteProject);
  const renameProject = useProjectStore(s => s.renameProject);
  const switchProject = useProjectStore(s => s.switchProject);
  const saveProject = useProjectStore(s => s.saveProject);
  const exportProject = useProjectStore(s => s.exportProject);

  return {
    initApp,
    createNewProject,
    deleteProject,
    renameProject,
    switchProject,
    saveProject,
    exportProject
  };
}
