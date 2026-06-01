import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { useProjectStore } from '../../../store/useProjectStore';
import { useAssetStore } from '../../asset/useAssetStore';

const addClipTool: AgentTool = {
  name: 'add_clip_to_track',
  description:
    '将视频/图片/文本/模板片段添加到指定轨道。支持自动查找可用轨道、智能分配轨道类型。如果未指定trackId，会自动查找或创建合适的轨道。',
  parameters: [
    {
      name: 'type',
      type: 'string',
      description: '片段类型: video(视频), image(图片), text(文字), template(模板), audio(音频)',
      required: true,
      enum: ['video', 'image', 'text', 'template', 'audio'],
    },
    {
      name: 'trackId',
      type: 'string',
      description: '目标轨道ID。如未提供，自动查找或创建合适轨道',
      required: false,
    },
    {
      name: 'startTime',
      type: 'number',
      description: '开始时间（秒），默认当前播放头位置',
      required: false,
      default: 0,
    },
    {
      name: 'duration',
      type: 'number',
      description: '持续时长（秒），默认5秒',
      required: false,
      default: 5,
    },
    {
      name: 'assetId',
      type: 'string',
      description: '关联素材ID（video/image/audio类型时使用）',
      required: false,
    },
    {
      name: 'content',
      type: 'string',
      description: '文本内容（text类型时使用）',
      required: false,
    },
    {
      name: 'fontSize',
      type: 'number',
      description: '字体大小（text类型，默认36）',
      required: false,
      default: 36,
    },
    {
      name: 'color',
      type: 'string',
      description: '文字颜色，十六进制格式（默认#ffffff）',
      required: false,
      default: '#ffffff',
    },
    {
      name: 'fontFamily',
      type: 'string',
      description: '字体名称（默认Arial）',
      required: false,
      default: 'Arial',
    },
    {
      name: 'x',
      type: 'number',
      description: 'X坐标偏移（默认0）',
      required: false,
      default: 0,
    },
    {
      name: 'y',
      type: 'number',
      description: 'Y坐标偏移（默认0）',
      required: false,
      default: 0,
    },
    {
      name: 'scale',
      type: 'number',
      description: '缩放比例（默认1）',
      required: false,
      default: 1,
    },
    {
      name: 'templateId',
      type: 'string',
      description: '模板ID（template类型时使用）',
      required: false,
    },
    {
      name: 'presetId',
      type: 'string',
      description: '入场动画预设ID（如 entrance_fade_in）。支持多个预设用逗号分隔',
      required: false,
    },
    {
      name: 'exitPresetId',
      type: 'string',
      description: '出场动画预设ID（如 exit_fade_out）',
      required: false,
    },
    {
      name: 'name',
      type: 'string',
      description: '片段自定义名称',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const projectState = useProjectStore.getState();
      let trackId = params.trackId;

      if (!trackId) {
        const targetType = params.type === 'audio' ? 'audio' : params.type === 'text' ? 'text' : 'video';
        const existingTrack = projectState.project.tracks.find(t => t.type === targetType);
        if (existingTrack) {
          trackId = existingTrack.id;
        } else {
          useProjectStore.getState().addTrack(targetType);
          const newTracks = useProjectStore.getState().project.tracks;
          const newTrack = newTracks.find(t => t.type === targetType);
          trackId = newTrack?.id || `track_${targetType}_1`;
        }
      }

      const startTime = params.startTime ?? context?.projectState?.currentTime ?? 0;

      const clipInput: any = {
        type: params.type,
        trackId,
        startTime,
        duration: params.duration ?? 5,
        transform: { x: params.x ?? 0, y: params.y ?? 0, scale: params.scale ?? 1, rotation: 0 },
        name: params.name,
      };

      if (params.type === 'text') {
        clipInput.textData = {
          content: (params.content || '').slice(0, 100),
          fontSize: params.fontSize ?? 36,
          color: params.color || '#ffffff',
          fontFamily: params.fontFamily || 'Arial',
          fontWeight: 'bold',
        };
      }

      if ((params.type === 'video' || params.type === 'image' || params.type === 'audio') && params.assetId) {
        const asset = useAssetStore.getState().getAssetById(params.assetId);
        if (!asset) {
          return { success: false, error: `素材 ${params.assetId} 不存在于项目中` };
        }
        clipInput.assetId = params.assetId;
        if (asset.duration && !params.duration) {
          clipInput.duration = asset.duration;
        }
      }

      if (params.type === 'template' && params.templateId) {
        clipInput.templateId = params.templateId;
      }

      const clip = projectAdapter.addClipToProject(clipInput);

      if (!clip) {
        return { success: false, error: '创建片段失败，请检查参数' };
      }

      const appliedEffects: string[] = [];

      if (params.presetId) {
        const presets = params.presetId.split(',').map((p: string) => p.trim()).filter(Boolean);
        for (const preset of presets) {
          if (preset.startsWith('entrance') || preset.startsWith('emphasis') || preset.startsWith('motion') || preset.startsWith('fx')) {
            projectAdapter.applyEffectToClip(clip.id, preset);
            appliedEffects.push(preset);
          }
        }
      }

      if (params.exitPresetId && params.exitPresetId.startsWith('exit')) {
        projectAdapter.applyEffectToClip(clip.id, params.exitPresetId);
        appliedEffects.push(params.exitPresetId);
      }

      if (!context.workingMemory.addedClipIds) {
        context.workingMemory.addedClipIds = [];
      }
      context.workingMemory.addedClipIds.push(clip.id);

      return {
        success: true,
        data: {
          clipId: clip.id,
          type: params.type,
          trackId,
          startTime,
          duration: clipInput.duration,
          appliedEffects,
        },
        metadata: { totalAdded: context.workingMemory.addedClipIds.length },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { addClipTool };
