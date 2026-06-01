import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { aiService } from '../services/AIService';

const textProcessorTool: AgentTool = {
  name: 'process_text_content',
  description:
    '将长文案拆分为适合视频展示的短句。用于处理用户提供的文案，将其分割成每句不超过10字的短句，便于在视频中逐行展示。',
  parameters: [
    {
      name: 'textContent',
      type: 'string',
      description: '要处理的长文案',
      required: true,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      const lines = await aiService.processTextContent(params.textContent);
      context.workingMemory.textLines = lines;
      return {
        success: true,
        data: lines,
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { textProcessorTool };
