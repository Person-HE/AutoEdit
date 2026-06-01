import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { useAssetStore } from '../../asset/useAssetStore';
import { useProjectStore } from '../../../store/useProjectStore';

const useAssetTool: AgentTool = {
  name: 'use_project_asset',
  description:
    '使用项目中已有的素材创建片段并添加到轨道。AI智能体应优先使用用户已有的素材，而不是总是生成新素材。支持按名称模糊搜索素材。',
  parameters: [
    {
      name: 'assetQuery',
      type: 'string',
      description: '素材查询条件：可以是素材ID、素材名称关键词、或素材类型(image/video/audio)',
      required: true,
    },
    {
      name: 'trackId',
      type: 'string',
      description: '目标轨道ID，不提供则自动分配',
      required: false,
    },
    {
      name: 'startTime',
      type: 'number',
      description: '开始时间（秒）',
      required: false,
      default: 0,
    },
    {
      name: 'duration',
      type: 'number',
      description: '持续时长（秒），默认使用素材原始时长或5秒',
      required: false,
    },
    {
      name: 'presetId',
      type: 'string',
      description: '入场动画预设ID',
      required: false,
    },
    {
      name: 'transform',
      type: 'object',
      description: '变换属性 {x, y, scale, rotation}',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const assets = useAssetStore.getState().assets;
      let matchedAsset = assets.find(a => a.id === params.assetQuery);

      if (!matchedAsset) {
        const lowerQuery = params.assetQuery.toLowerCase();
        matchedAsset = assets.find(
          a =>
            a.name.toLowerCase().includes(lowerQuery) ||
            (a.type && a.type.toLowerCase() === lowerQuery)
        );
      }

      if (!matchedAsset) {
        const availableAssets = assets.slice(0, 10).map(a => `${a.name}(${a.type}, ${a.id})`).join(', ');
        return {
          success: false,
          error: `未找到匹配素材: "${params.assetQuery}"。项目中可用素材: ${availableAssets || '无'}`,
        };
      }

      const projectState = useProjectStore.getState();
      let trackId = params.trackId;
      if (!trackId) {
        const targetType = matchedAsset.type === 'audio' ? 'audio' : 'video';
        const track = projectState.project.tracks.find(t => t.type === targetType);
        trackId = track?.id;
        if (!trackId) {
          useProjectStore.getState().addTrack(targetType);
          const newTrack = useProjectStore.getState().project.tracks.find(t => t.type === targetType);
          trackId = newTrack?.id;
        }
      }

      const duration = params.duration ?? matchedAsset.duration ?? 5;
      const startTime = params.startTime ?? context?.projectState?.currentTime ?? 0;

      const clip = projectAdapter.addClipToProject({
        type: matchedAsset.type === 'image' ? 'image' : 'video',
        assetId: matchedAsset.id,
        trackId: trackId!,
        startTime,
        duration,
        transform: params.transform || { x: 0, y: 0, scale: 1, rotation: 0 },
        name: matchedAsset.name,
      });

      if (!clip) {
        return { success: false, error: '创建片段失败' };
      }

      if (params.presetId) {
        projectAdapter.applyEffectToClip(clip.id, params.presetId);
      }

      if (!context.workingMemory.addedClipIds) {
        context.workingMemory.addedClipIds = [];
      }
      context.workingMemory.addedClipIds.push(clip.id);

      return {
        success: true,
        data: {
          clipId: clip.id,
          assetId: matchedAsset.id,
          assetName: matchedAsset.name,
          trackId,
          startTime,
          duration,
        },
        metadata: { totalAdded: context.workingMemory.addedClipIds.length },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { useAssetTool };
