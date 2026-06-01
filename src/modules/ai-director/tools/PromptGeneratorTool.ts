import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { aiService } from '../services/AIService';

const promptGeneratorTool: AgentTool = {
  name: 'generate_image_prompts',
  description:
    '根据素材描述生成AI绘画提示词。用于为视频生成背景图片、场景图等素材。',
  parameters: [
    {
      name: 'descriptions',
      type: 'array',
      description: '素材描述数组',
      required: true,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const prompts = await aiService.generateImagePrompts(params.descriptions);
      context.workingMemory.imagePrompts = prompts;
      return {
        success: true,
        data: prompts,
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { promptGeneratorTool };
