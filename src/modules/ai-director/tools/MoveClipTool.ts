import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';

const moveClipTool: AgentTool = {
  name: 'move_clip',
  description:
    '移动片段到新的轨道或新的时间位置。AI智能体可以重新排列片段顺序、调整片段在轨道上的位置。',
  parameters: [
    {
      name: 'clipId',
      type: 'string',
      description: '要移动的片段ID',
      required: true,
    },
    {
      name: 'targetTrackId',
      type: 'string',
      description: '目标轨道ID，不提供则保持当前轨道',
      required: false,
    },
    {
      name: 'newStartTime',
      type: 'number',
      description: '新的开始时间（秒），不提供则保持当前时间',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const clip = (projectState.project.clips || {})[params.clipId];

      if (!clip) {
        return { success: false, error: `片段 ${params.clipId} 不存在` };
      }

      const trackId = params.targetTrackId || clip.trackId;
      const startTime = params.newStartTime !== undefined ? params.newStartTime : clip.startTime;

      if (params.targetTrackId && params.targetTrackId !== clip.trackId) {
        const targetTrack = projectState.project.tracks.find(t => t.id === trackId);
        if (!targetTrack) {
          return { success: false, error: `目标轨道 ${trackId} 不存在` };
        }
      }

      const success = useProjectStore.getState().moveClip(params.clipId, trackId, startTime);

      if (!success) {
        return { success: false, error: '移动片段失败' };
      }

      return {
        success: true,
        data: {
          clipId: params.clipId,
          previousTrackId: clip.trackId,
          previousStartTime: clip.startTime,
          newTrackId: trackId,
          newStartTime: startTime,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { moveClipTool };
