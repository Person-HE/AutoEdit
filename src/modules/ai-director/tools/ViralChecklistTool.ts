import { AgentTool, ToolResult, AgentContext } from '../core/AgentTypes';
import { aiService } from '../services/AIService';

/**
 * 爆款检查清单工具
 * 用10问法严格检查视频内容是否能爆
 * 给出评分、判定结果和优化计划
 */
const viralChecklistTool: AgentTool = {
  name: 'viral_checklist',
  description:
    '用爆款10问法严格检查视频内容是否能爆。检查选题/钩子/价值/结构/情绪/真实/人设/互动/平台/数据10个维度，给出评分、判定结果（likely_viral/needs_optimization/unlikely_viral）、关键问题和优化计划。必须在内容设计完成后调用，用于质量把关。',
  parameters: [
    {
      name: 'design',
      type: 'object',
      description: '内容设计方案（来自 design_viral_content 的返回）。如果未提供，会自动从工作记忆中读取',
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
      const design = params.design || context.workingMemory.contentDesign;
      const analysis = params.analysis || context.workingMemory.analysis;

      if (!design || !analysis) {
        return {
          success: false,
          error: '未找到内容设计方案或分析结果，请先调用 analyze_user_input 和 design_viral_content',
        };
      }

      const result = await aiService.runViralChecklist(design as any, analysis as any);

      // 存入工作记忆
      context.workingMemory.viralCheck = result as any;

      return {
        success: true,
        data: {
          totalScore: result.totalScore,
          verdict: result.verdict,
          verdictReason: result.verdictReason,
          passedChecks: result.checks.filter(c => c.passed).length,
          totalChecks: result.checks.length,
          criticalIssues: result.criticalIssues,
          optimizationPlan: result.optimizationPlan,
          checks: result.checks.map(c => ({
            name: c.name,
            passed: c.passed,
            score: c.score,
            suggestion: c.suggestion,
          })),
        },
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

export { viralChecklistTool };
