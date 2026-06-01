import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';
import { projectAdapter } from '../adapters/ProjectAdapter';

const duplicateClipTool: AgentTool = {
  name: 'duplicate_clip',
  description:
    '复制指定片段并在同一轨道或其他轨道上创建副本。AI智能体可以快速复制内容，用于重复效果或变体创作。',
  parameters: [
    {
      name: 'clipId',
      type: 'string',
      description: '要复制的源片段ID',
      required: true,
    },
    {
      name: 'targetTrackId',
      type: 'string',
      description: '目标轨道ID，不提供则复制到同一轨道',
      required: false,
    },
    {
      name: 'offsetTime',
      type: 'number',
      description: '相对于源片段的时间偏移（秒），默认0',
      required: false,
      default: 0,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const sourceClip = (projectState.project.clips || {})[params.clipId];

      if (!sourceClip) {
        return { success: false, error: `源片段 ${params.clipId} 不存在` };
      }

      const trackId = params.targetTrackId || sourceClip.trackId;
      const startTime = sourceClip.startTime + (params.offsetTime ?? 0);

      const targetTrack = projectState.project.tracks.find(t => t.id === trackId);
      if (!targetTrack) {
        return { success: false, error: `目标轨道 ${trackId} 不存在` };
      }

      const clipInput: any = {
        type: sourceClip.type,
        trackId,
        startTime,
        duration: sourceClip.duration,
        transform: { ...sourceClip.transform },
        name: `${sourceClip.name}_副本`,
      };

      if (sourceClip.assetId) clipInput.assetId = sourceClip.assetId;
      if (sourceClip.textData) clipInput.textData = { ...sourceClip.textData };
      if (sourceClip.templateData) clipInput.templateData = { ...sourceClip.templateData };

      const newClip = projectAdapter.addClipToProject(clipInput);

      if (!newClip) {
        return { success: false, error: '复制片段失败' };
      }

      if (!context.workingMemory.addedClipIds) {
        context.workingMemory.addedClipIds = [];
      }
      context.workingMemory.addedClipIds.push(newClip.id);

      return {
        success: true,
        data: {
          sourceClipId: params.clipId,
          newClipId: newClip.id,
          trackId,
          startTime,
          duration: sourceClip.duration,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { duplicateClipTool };
