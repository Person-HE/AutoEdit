import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';

const removeClipTool: AgentTool = {
  name: 'remove_clip',
  description:
    '从项目中删除指定片段。AI智能体可以根据用户需求删除不需要的片段，清理轨道内容。',
  parameters: [
    {
      name: 'clipId',
      type: 'string',
      description: '要删除的片段ID',
      required: true,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      const clip = (projectState.project.clips || {})[params.clipId];

      if (!clip) {
        return { success: false, error: `片段 ${params.clipId} 不存在` };
      }

      useProjectStore.getState().removeClip(params.clipId);

      if (context.workingMemory.addedClipIds) {
        context.workingMemory.addedClipIds = context.workingMemory.addedClipIds.filter(
          (id: string) => id !== params.clipId
        );
      }

      return {
        success: true,
        data: {
          removedClipId: params.clipId,
          type: clip.type,
          name: clip.name,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { removeClipTool };
