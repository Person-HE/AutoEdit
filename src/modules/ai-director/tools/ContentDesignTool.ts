import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { aiService } from '../services/AIService';

/**
 * 爆款内容设计工具
 * 基于内容分析结果，生成完整的内容设计方案
 * 覆盖钩子/结构/情绪/价值/人设/互动六大内容支柱
 */
const contentDesignTool: AgentTool = {
  name: 'design_viral_content',
  description:
    '基于爆款内容分析结果，生成完整的内容设计方案。包含完整的钩子文案、脚本结构、情绪曲线设计、价值交付路径、人设表现方式、互动引导话术，并给出爆款评分。这是爆款视频创作的核心设计步骤，必须在 analyze_user_input 之后、generate_shot_data 之前调用。',
  parameters: [
    {
      name: 'platform',
      type: 'string',
      description: '目标平台（可选）：douyin|xiaohongshu|bilibili|youtube|tiktok|wechat_video',
      required: false,
    },
    {
      name: 'analysis',
      type: 'object',
      description: '内容分析结果（来自 analyze_user_input 的返回）。如果未提供，会自动从工作记忆中读取',
      required: false,
    },
  ],
  async execute(params, context: AgentContext) {
    try {
      // 从工作记忆或参数获取分析结果
      const analysis = params.analysis || context.workingMemory.analysis;
      if (!analysis) {
        return {
          success: false,
          error: '未找到内容分析结果，请先调用 analyze_user_input',
        };
      }

      const platform = params.platform || '通用';
      const design = await aiService.designViralContent(analysis, platform);

      // 存入工作记忆
      context.workingMemory.contentDesign = design as any;

      return {
        success: true,
        data: {
          hookScript: design.hookScript,
          hookVisual: design.hookVisual,
          fullScriptCount: design.fullScript.length,
          emotionCurvePoints: design.emotionDesign.curve.length,
          keyTurningPoints: design.emotionDesign.keyTurningPoints,
          valueDelivery: design.valueDeliveryPlan.promise,
          socialCurrency: design.valueDeliveryPlan.socialCurrency,
          personaLabel: design.personaExpression,
          interactionScripts: design.interactionScripts,
          viralScore: design.viralScore,
          design,
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { contentDesignTool };
