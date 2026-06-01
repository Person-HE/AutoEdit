import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useProjectStore } from '../../../store/useProjectStore';

const removeEffectTool: AgentTool = {
  name: 'remove_effect',
  description:
    '从片段上移除指定效果或所有效果。AI智能体可以根据需求清除片段上的动画效果。',
  parameters: [
    {
      name: 'clipId',
      type: 'string',
      description: '目标片段ID',
      required: true,
    },
    {
      name: 'effectId',
      type: 'string',
      description: '要移除的效果ID，不提供则移除所有效果',
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

      const effects = clip.effects || [];

      if (effects.length === 0) {
        return { success: false, error: '片段上没有效果可移除' };
      }

      if (params.effectId) {
        const effectExists = effects.find(e => e.id === params.effectId);
        if (!effectExists) {
          return {
            success: false,
            error: `效果 ${params.effectId} 不存在于片段上。可用效果: ${effects.map(e => e.id).join(', ')}`,
          };
        }
        useProjectStore.getState().removeEffectFromClip(params.clipId, params.effectId);
        return {
          success: true,
          data: {
            clipId: params.clipId,
            removedEffectId: params.effectId,
            remainingEffects: effects.length - 1,
          },
        };
      } else {
        const removedCount = effects.length;
        for (const effect of effects) {
          useProjectStore.getState().removeEffectFromClip(params.clipId, effect.id);
        }
        return {
          success: true,
          data: {
            clipId: params.clipId,
            removedAll: true,
            removedCount,
          },
        };
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { removeEffectTool };
