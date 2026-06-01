import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { projectAdapter } from '../adapters/ProjectAdapter';
import { aiService } from '../services/AIService';
import { v4 as uuidv4 } from 'uuid';

const generateAssetTool: AgentTool = {
  name: 'generate_asset_with_ai',
  description:
    '使用AI(ComfyUI/SDXL)生成图片素材并添加到项目。当项目中没有合适素材时，根据描述自动生成。生成后会自动注册为项目素材，可直接用于创建片段。',
  parameters: [
    {
      name: 'description',
      type: 'string',
      description: '素材画面描述（中文或英文）',
      required: true,
    },
    {
      name: 'assetName',
      type: 'string',
      description: '素材名称，不提供则自动生成',
      required: false,
    },
    {
      name: 'style',
      type: 'string',
      description: '风格关键词，如"赛博朋克"、"水墨风"、"3D渲染"等',
      required: false,
    },
    {
      name: 'width',
      type: 'number',
      description: '图片宽度，默认1920',
      required: false,
      default: 1920,
    },
    {
      name: 'height',
      type: 'number',
      description: '图片高度，默认1080',
      required: false,
      default: 1080,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const description = params.description;
      const style = params.style || '';
      const fullDescription = style ? `${description}, ${style}风格` : description;

      const prompts = await aiService.generateImagePrompts([fullDescription]);
      const promptData = prompts[0];

      if (!promptData) {
        return { success: false, error: '生成提示词失败' };
      }

      const assetId = `ai_gen_${uuidv4().slice(0, 8)}`;
      const assetName = params.assetName || `AI生成_${description.slice(0, 20)}`;

      const asset = {
        id: assetId,
        name: assetName,
        type: 'image' as const,
        url: '',
        width: params.width ?? 1920,
        height: params.height ?? 1080,
        thumbnailUrl: '',
        metadata: {
          generated: true,
          prompt: promptData.prompt,
          negativePrompt: promptData.negativePrompt,
          source: 'comfyui',
        },
      };

      projectAdapter.addAssetsToProject([asset as any]);

      context.workingMemory.imagePrompts = context.workingMemory.imagePrompts || [];
      context.workingMemory.imagePrompts.push({
        assetId,
        prompt: promptData.prompt,
        negativePrompt: promptData.negativePrompt,
      });

      return {
        success: true,
        data: {
          assetId,
          name: assetName,
          prompt: promptData.prompt,
          negativePrompt: promptData.negativePrompt,
          description: fullDescription,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          dimensions: `${params.width ?? 1920}x${params.height ?? 1080}`,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { generateAssetTool };
