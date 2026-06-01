import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { aiService } from '../services/AIService';

const analyzeTool: AgentTool = {
  name: 'analyze_user_input',
  description:
    '分析用户的视频需求输入，提取素材需求、分镜描述和文案内容。这是AI导演的第一步，用于理解用户意图。',
  parameters: [
    {
      name: 'userInput',
      type: 'string',
      description: '用户的自然语言描述',
      required: true,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const analysis = await aiService.analyzeUserInput(params.userInput);
      context.workingMemory.analysis = analysis;
      return {
        success: true,
        data: analysis,
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { analyzeTool };
