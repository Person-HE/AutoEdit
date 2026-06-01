import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { aiService } from '../services/AIService';

const shotGeneratorTool: AgentTool = {
  name: 'generate_shot_data',
  description:
    '根据分镜描述生成完整的AIScript JSON数据。这是AI导演的核心步骤，将自然语言描述转化为结构化的视频编辑数据。',
  parameters: [
    {
      name: 'shotDescription',
      type: 'string',
      description: '分镜描述',
      required: true,
    },
    {
      name: 'customSystemPrompt',
      type: 'string',
      description: '自定义系统提示词（可选）',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const shotData = await aiService.generateShotData(
        params.shotDescription,
        params.customSystemPrompt
      );
      context.workingMemory.shotData = shotData;
      return {
        success: true,
        data: shotData,
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { shotGeneratorTool };
