import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';
import { useAssetStore } from '../../asset/useAssetStore';

const observeProjectTool: AgentTool = {
  name: 'observe_project_state',
  description:
    '观察并获取当前项目的完整状态快照，包括轨道列表、片段数量、素材数量、时间信息等。这是 Agent 感知项目当前状态的关键工具，应在执行其他操作前调用以了解当前状态。',
  parameters: [],
  async execute(_params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const assetState = useAssetStore.getState();

      const tracks = (projectState.project.tracks || []).map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
        visible: t.visible,
        locked: t.locked,
      }));

      const clips = Object.values(projectState.project.clips || {});
      const assets = assetState.assets || [];

      const snapshot = {
        tracks,
        clipsCount: clips.length,
        assetsCount: assets.length,
        currentTime: 0, // currentTime is in UIStore, not ProjectState
        totalDuration: projectState.project.duration ?? 30,
        canvasSize: {
          width: projectState.project.width ?? 1920,
          height: projectState.project.height ?? 1080,
        },
        fps: projectState.project.fps ?? 30,
        recentClips: clips.slice(-5).map((c: any) => ({
          id: c.id,
          type: c.type,
          startTime: c.startTime,
          duration: c.duration,
          trackId: c.trackId,
        })),
        recentAssets: assets.slice(-5).map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
        })),
      };

      if (context) {
        context.projectState = snapshot as any;
      }

      return {
        success: true,
        data: snapshot,
        metadata: { observedAt: new Date().toISOString() },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { observeProjectTool };
