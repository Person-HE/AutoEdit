import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import type { Asset } from '../../shared/types';

const addAssetTool: AgentTool = {
  name: 'add_asset_to_project',
  description:
    '将素材（图片、视频、音频）添加到项目中。在添加片段到轨道之前，需要先确保素材已注册到项目中。',
  parameters: [
    {
      name: 'assets',
      type: 'array',
      description: '要添加的素材数组，每个元素包含 id, name, type, url 等字段',
      required: true,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      if (!Array.isArray(params.assets) || params.assets.length === 0) {
        return { success: false, error: 'assets 必须是非空数组' };
      }
      const typedAssets: Asset[] = params.assets.map((a: any) => ({
        id: a.id,
        name: a.name || `素材_${a.id}`,
        type: a.type || 'image',
        url: a.url || '',
        thumbnail: a.thumbnailUrl || a.thumbnail || '',
        width: a.width || 1920,
        height: a.height || 1080,
        duration: a.duration,
        createdAt: Date.now(),
      }));
      projectAdapter.addAssetsToProject(typedAssets);
      return {
        success: true,
        data: { addedCount: typedAssets.length, assetIds: typedAssets.map((a) => a.id) },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { addAssetTool };
