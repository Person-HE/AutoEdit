import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { useProjectStore } from '../../../store/useProjectStore';
import { useAssetStore } from '../../asset/useAssetStore';

interface BatchItem {
  type: 'video' | 'image' | 'text' | 'template' | 'audio';
  trackId?: string;
  startTime?: number;
  duration?: number;
  assetId?: string;
  content?: string;
  templateId?: string;
  fontSize?: number;
  color?: string;
  x?: number;
  y?: number;
  scale?: number;
  presetId?: string;
  exitPresetId?: string;
  name?: string;
}

const batchAddTool: AgentTool = {
  name: 'batch_add_clips',
  description:
    '批量添加多个片段到轨道。用于一次性创建完整的视频结构，如多段文字、多个素材、多层效果等。items数组中每个元素是一个片段配置。',
  parameters: [
    {
      name: 'items',
      type: 'array',
      description: '片段配置数组，每个元素包含type, content/assetId, startTime, duration等字段',
      required: true,
    },
    {
      name: 'baseStartTime',
      type: 'number',
      description: '基础开始时间，所有片段的startTime会叠加此值',
      required: false,
      default: 0,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      if (!Array.isArray(params.items) || params.items.length === 0) {
        return { success: false, error: 'items 必须是非空数组' };
      }

      const baseStartTime = params.baseStartTime ?? context?.projectState?.currentTime ?? 0;
      const results: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < params.items.length; i++) {
        const item: BatchItem = params.items[i];
        try {
          const projectState = useProjectStore.getState();
          let trackId = item.trackId;

          if (!trackId) {
            const targetType = item.type === 'audio' ? 'audio' : item.type === 'text' ? 'text' : 'video';
            const existingTrack = projectState.project.tracks.find(t => t.type === targetType);
            if (existingTrack) {
              trackId = existingTrack.id;
            } else {
              useProjectStore.getState().addTrack(targetType);
              const newTracks = useProjectStore.getState().project.tracks;
              const newTrack = newTracks.find(t => t.type === targetType);
              trackId = newTrack?.id;
            }
          }

          const startTime = (item.startTime ?? 0) + baseStartTime;

          const clipInput: any = {
            type: item.type,
            trackId: trackId!,
            startTime,
            duration: item.duration ?? 5,
            transform: { x: item.x ?? 0, y: item.y ?? 0, scale: item.scale ?? 1, rotation: 0 },
            name: item.name,
          };

          if (item.type === 'text') {
            clipInput.textData = {
              content: (item.content || '').slice(0, 100),
              fontSize: item.fontSize ?? 36,
              color: item.color || '#ffffff',
              fontFamily: 'Arial',
              fontWeight: 'bold',
            };
          }

          if ((item.type === 'video' || item.type === 'image' || item.type === 'audio') && item.assetId) {
            const asset = useAssetStore.getState().getAssetById(item.assetId);
            if (asset) {
              clipInput.assetId = item.assetId;
              if (asset.duration && !item.duration) {
                clipInput.duration = asset.duration;
              }
            }
          }

          if (item.type === 'template' && item.templateId) {
            clipInput.templateId = item.templateId;
          }

          const clip = projectAdapter.addClipToProject(clipInput);

          if (!clip) {
            errors.push(`第${i + 1}个片段创建失败`);
            continue;
          }

          const appliedEffects: string[] = [];

          if (item.presetId) {
            const presets = item.presetId.split(',').map((p: string) => p.trim()).filter(Boolean);
            for (const preset of presets) {
              projectAdapter.applyEffectToClip(clip.id, preset);
              appliedEffects.push(preset);
            }
          }

          if (item.exitPresetId) {
            projectAdapter.applyEffectToClip(clip.id, item.exitPresetId);
            appliedEffects.push(item.exitPresetId);
          }

          if (!context.workingMemory.addedClipIds) {
            context.workingMemory.addedClipIds = [];
          }
          context.workingMemory.addedClipIds.push(clip.id);

          results.push({
            index: i,
            clipId: clip.id,
            type: item.type,
            trackId,
            startTime,
            duration: clipInput.duration,
            appliedEffects,
          });
        } catch (itemError) {
          errors.push(`第${i + 1}个片段错误: ${itemError instanceof Error ? itemError.message : String(itemError)}`);
        }
      }

      return {
        success: results.length > 0,
        data: {
          addedCount: results.length,
          failedCount: errors.length,
          items: results,
        },
        error: errors.length > 0 ? errors.join('; ') : undefined,
        metadata: { totalAdded: context.workingMemory.addedClipIds?.length ?? 0 },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { batchAddTool };
