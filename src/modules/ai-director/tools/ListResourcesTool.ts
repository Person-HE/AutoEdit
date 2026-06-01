import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { useAssetStore } from '../../asset/useAssetStore';
import { useProjectStore } from '../../../store/useProjectStore';
import { getAllTemplates, getTemplateCategories } from '../../../engine/templates';
import { PRESETS } from '../../../engine/presets';

const listResourcesTool: AgentTool = {
  name: 'list_project_resources',
  description:
    '列出项目中的所有可用资源：素材、模板、预设、轨道、片段。AI智能体在执行操作前应先调用此工具了解项目中有哪些可用资源，以便智能决策。',
  parameters: [
    {
      name: 'resourceType',
      type: 'string',
      description: '资源类型: all(全部), assets(素材), templates(模板), presets(预设), tracks(轨道), clips(片段)',
      required: false,
      enum: ['all', 'assets', 'templates', 'presets', 'tracks', 'clips'],
      default: 'all',
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const type = params.resourceType || 'all';
      const result: any = {};

      if (type === 'all' || type === 'assets') {
        const assets = useAssetStore.getState().assets;
        result.assets = {
          count: assets.length,
          items: assets.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            width: a.width,
            height: a.height,
            duration: a.duration,
          })),
        };
      }

      if (type === 'all' || type === 'templates') {
        const templates = getAllTemplates();
        const categories = getTemplateCategories();
        result.templates = {
          count: templates.length,
          categories: categories.map(c => c.key),
          items: templates.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category,
            description: t.description,
          })),
        };
      }

      if (type === 'all' || type === 'presets') {
        const presetEntries = Object.values(PRESETS);
        const categories = [...new Set(presetEntries.map(p => p.category))];
        result.presets = {
          count: presetEntries.length,
          categories,
          items: presetEntries.slice(0, 30).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
          })),
        };
      }

      if (type === 'all' || type === 'tracks') {
        const tracks = useProjectStore.getState().project.tracks;
        result.tracks = {
          count: tracks.length,
          items: tracks.map(t => ({
            id: t.id,
            type: t.type,
            name: t.name,
            visible: t.visible,
            locked: t.locked,
          })),
        };
      }

      if (type === 'all' || type === 'clips') {
        const clips = Object.values(useProjectStore.getState().project.clips || {});
        result.clips = {
          count: clips.length,
          items: clips.map(c => ({
            id: c.id,
            type: c.type,
            name: c.name,
            trackId: c.trackId,
            startTime: c.startTime,
            duration: c.duration,
            effectsCount: c.effects?.length || 0,
          })),
        };
      }

      return {
        success: true,
        data: result,
        metadata: {
          queryType: type,
          totalResources:
            (result.assets?.count || 0) +
            (result.templates?.count || 0) +
            (result.presets?.count || 0) +
            (result.tracks?.count || 0) +
            (result.clips?.count || 0),
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { listResourcesTool };
