import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';

const trackVisibilityTool: AgentTool = {
  name: 'toggle_track_visibility',
  description:
    '切换轨道的可见性（显示/隐藏）或锁定状态。AI智能体可以控制哪些轨道在预览中可见，或防止误操作锁定轨道。',
  parameters: [
    {
      name: 'trackId',
      type: 'string',
      description: '目标轨道ID',
      required: true,
    },
    {
      name: 'action',
      type: 'string',
      description: '操作类型: toggleVisibility(切换可见性), toggleLock(切换锁定), setVisible(设为可见), setHidden(设为隐藏), setLocked(锁定), setUnlocked(解锁)',
      required: true,
      enum: ['toggleVisibility', 'toggleLock', 'setVisible', 'setHidden', 'setLocked', 'setUnlocked'],
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const track = projectState.project.tracks.find(t => t.id === params.trackId);

      if (!track) {
        return { success: false, error: `轨道 ${params.trackId} 不存在` };
      }

      let newVisible = track.visible;
      let newLocked = track.locked;

      switch (params.action) {
        case 'toggleVisibility':
          newVisible = !track.visible;
          break;
        case 'toggleLock':
          newLocked = !track.locked;
          break;
        case 'setVisible':
          newVisible = true;
          break;
        case 'setHidden':
          newVisible = false;
          break;
        case 'setLocked':
          newLocked = true;
          break;
        case 'setUnlocked':
          newLocked = false;
          break;
        default:
          return { success: false, error: `未知操作: ${params.action}` };
      }

      useProjectStore.getState().updateTrack(params.trackId, {
        visible: newVisible,
        locked: newLocked,
      });

      return {
        success: true,
        data: {
          trackId: params.trackId,
          trackName: track.name,
          visible: newVisible,
          locked: newLocked,
          previousVisible: track.visible,
          previousLocked: track.locked,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { trackVisibilityTool };
