import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { PRESETS } from '../../../engine/presets';

const applyEffectTool: AgentTool = {
  name: 'apply_preset_effect',
  description:
    '为指定片段应用动画预设效果。支持入场(entrance)、出场(exit)、强调(emphasis)、位移(motion)、特效(fx)等多种预设。',
  parameters: [
    {
      name: 'clipId',
      type: 'string',
      description: '目标片段ID',
      required: true,
    },
    {
      name: 'presetId',
      type: 'string',
      description: '预设ID，如 entrance_fade_in、exit_slide_out_up、emphasis_bounce 等',
      required: true,
    },
    {
      name: 'params',
      type: 'object',
      description: '预设参数，如 { duration: 1.0 }',
      required: false,
      default: {},
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      if (!PRESETS[params.presetId]) {
        const available = Object.keys(PRESETS).slice(0, 20).join(', ');
        return {
          success: false,
          error: `预设 "${params.presetId}" 不存在。可用预设: ${available}...`,
        };
      }

      const success = projectAdapter.applyEffectToClip(params.clipId, params.presetId, params.params || {});

      if (!success) {
        return { success: false, error: '应用效果失败' };
      }

      return {
        success: true,
        data: {
          clipId: params.clipId,
          presetId: params.presetId,
          params: params.params,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { applyEffectTool };
