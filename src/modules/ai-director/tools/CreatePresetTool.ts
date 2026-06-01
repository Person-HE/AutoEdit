import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { PRESETS } from '../../../engine/presets';

const createPresetTool: AgentTool = {
  name: 'create_custom_preset',
  description:
    '创建新的自定义动画预设。AI智能体可以根据用户需求动态创建新的动画效果预设，然后应用到片段上。支持创建基于关键帧的自定义动画。',
  parameters: [
    {
      name: 'presetId',
      type: 'string',
      description: '预设唯一ID，格式如 custom_fade_in_left',
      required: true,
    },
    {
      name: 'name',
      type: 'string',
      description: '预设显示名称',
      required: true,
    },
    {
      name: 'category',
      type: 'string',
      description: '预设类别: entrance(入场), exit(出场), emphasis(强调), motion(位移), fx(特效)',
      required: true,
      enum: ['entrance', 'exit', 'emphasis', 'motion', 'fx'],
    },
    {
      name: 'description',
      type: 'string',
      description: '预设描述',
      required: false,
    },
    {
      name: 'keyframes',
      type: 'array',
      description: '关键帧定义数组，每个元素包含 { time(0-1), x, y, scale, rotation, opacity }',
      required: true,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      if (PRESETS[params.presetId]) {
        return {
          success: false,
          error: `预设ID "${params.presetId}" 已存在，请使用其他ID`,
        };
      }

      const keyframes = params.keyframes || [];
      if (!Array.isArray(keyframes) || keyframes.length < 2) {
        return {
          success: false,
          error: '至少需要2个关键帧来定义动画',
        };
      }

      const preset = {
        id: params.presetId,
        name: params.name,
        category: params.category,
        description: params.description || `${params.name} 动画效果`,
        apply: (progress: number, params: any, baseTransform: any) => {
          const sortedFrames = [...keyframes].sort((a: any, b: any) => a.time - b.time);

          let prevFrame = sortedFrames[0];
          let nextFrame = sortedFrames[sortedFrames.length - 1];

          for (let i = 0; i < sortedFrames.length - 1; i++) {
            if (progress >= sortedFrames[i].time && progress <= sortedFrames[i + 1].time) {
              prevFrame = sortedFrames[i];
              nextFrame = sortedFrames[i + 1];
              break;
            }
          }

          const segmentDuration = nextFrame.time - prevFrame.time;
          const segmentProgress = segmentDuration > 0
            ? (progress - prevFrame.time) / segmentDuration
            : 0;

          const easeProgress = segmentProgress * segmentProgress * (3 - 2 * segmentProgress);

          const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

          return {
            transform: {
              x: lerp(prevFrame.x ?? 0, nextFrame.x ?? 0, easeProgress),
              y: lerp(prevFrame.y ?? 0, nextFrame.y ?? 0, easeProgress),
              scale: lerp(prevFrame.scale ?? 1, nextFrame.scale ?? 1, easeProgress),
              rotation: lerp(prevFrame.rotation ?? 0, nextFrame.rotation ?? 0, easeProgress),
            },
            opacity: lerp(prevFrame.opacity ?? 1, nextFrame.opacity ?? 1, easeProgress),
          };
        },
        schema: [
          { key: 'duration', label: '持续时间', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1 },
        ],
      };

      (PRESETS as any)[params.presetId] = preset;

      context.workingMemory.customPresets = context.workingMemory.customPresets || [];
      context.workingMemory.customPresets.push(params.presetId);

      return {
        success: true,
        data: {
          presetId: params.presetId,
          name: params.name,
          category: params.category,
          keyframeCount: keyframes.length,
        },
        metadata: {
          totalPresets: Object.keys(PRESETS).length,
          customPresetsCount: context.workingMemory.customPresets.length,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { createPresetTool };
