import {
  AgentContext,
  AgentResult,
  AgentStatus,
  Message,
  ToolCallInfo,
  ToolResult,
  WorkingMemory,
  ReflectionEntry,
  ErrorEntry,
  AgentPlan,
} from '../core/AgentTypes';
import { toolSystem } from '../core/ToolSystem';
import { AgentMemory } from '../memory/AgentMemory';
import { aiService } from '../services/AIService';
import { SYSTEM_PROMPTS } from '../prompts/systemPrompts';

type LoopAction =
  | { type: 'think'; thought: string }
  | { type: 'act'; tool: string; params: Record<string, any>; reasoning: string }
  | { type: 'observe'; observation: string }
  | { type: 'reflect'; reflection: string; correction?: string }
  | { type: 'finish'; output: string }
  | { type: 'error'; error: string };

interface PlannerConfig {
  maxIterations?: number;
  maxReflections?: number;
  enableSelfCorrection?: boolean;
  verbose?: boolean;
}

class ReActPlanner {
  private config: Required<PlannerConfig>;

  constructor(private memory: AgentMemory, config: PlannerConfig = {}) {
    this.config = {
      maxIterations: config.maxIterations ?? 30,
      maxReflections: config.maxReflections ?? 3,
      enableSelfCorrection: config.enableSelfCorrection ?? true,
      verbose: config.verbose ?? false,
    };
  }

  async run(context: AgentContext): Promise<AgentResult> {
    this.memory.clearWorkingMemory();
    const plan = this.generateInitialPlan(context.userInput);
    this.memory.setWorkingData('plan', plan);

    let iteration = 0;
    let lastError: string | null = null;
    let consecutiveErrors = 0;

    while (iteration < this.config.maxIterations) {
      iteration++;
      if (this.config.verbose) {
        console.log(`[ReAct] === 迭代 ${iteration}/${this.config.maxIterations} ===`);
      }

      const reactPrompt = this.buildReActPrompt(context, iteration);
      let llmResponse: string;

      try {
        llmResponse = await this.callLLMWithTimeout(
          [{ role: 'system', content: reactPrompt }, { role: 'user', content: `请继续执行（第${iteration}轮）` }],
          { temperature: context.config.temperature ?? 0.7 },
          60000
        );
        consecutiveErrors = 0;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        consecutiveErrors++;
        this.memory.addError({ step: iteration, tool: 'llm_call', error: lastError, recovered: false });
        if (consecutiveErrors >= 3) {
          return this.buildErrorResult(lastError, iteration, context, 'LLM连续调用失败，请检查网络或API配置');
        }
        continue;
      }

      const action = this.parseLLMResponse(llmResponse);
      this.memory.addAssistantMessage(llmResponse);

      switch (action.type) {
        case 'think':
          if (this.config.verbose) console.log(`[ReAct] Thought: ${action.thought}`);
          this.memory.addToolMessage('thought', { success: true, data: { thought: action.thought } });
          break;

        case 'act': {
          if (this.config.verbose)
            console.log(`[ReAct] Action: ${action.tool}(${JSON.stringify(action.params)}) — ${action.reasoning}`);

          const toolResult = await this.executeToolWithTimeout(action.tool, action.params, context, 30000);
          this.memory.addToolMessage(action.tool, toolResult);
          const observation = this.formatObservation(toolResult);
          if (this.config.verbose) console.log(`[ReAct] Observation: ${observation.slice(0, 200)}`);

          if (!toolResult.success) {
            consecutiveErrors++;
            this.memory.addError({
              step: iteration,
              tool: action.tool,
              error: toolResult.error ?? '未知错误',
              recovered: false,
            });

            if (consecutiveErrors >= 3) {
              return this.buildErrorResult(
                `连续${consecutiveErrors}次工具执行失败: ${toolResult.error}`,
                iteration,
                context
              );
            }

            if (this.config.enableSelfCorrection && this.memory.getErrors().length >= 2) {
              const reflection = await this.reflect(context, iteration);
              if (reflection.correction) {
                this.memory.addToolMessage('self_correction', {
                  success: true,
                  data: { correction: reflection.correction },
                });
                continue;
              }
            }
          } else {
            consecutiveErrors = 0;
          }
          break;
        }

        case 'finish':
          this.memory.saveEpisode(context.userInput, action.output);
          return this.buildSuccessResult(action.output, iteration, context);

        case 'error':
          lastError = action.error;
          consecutiveErrors++;
          this.memory.addError({ step: iteration, tool: 'parsing', error: action.error, recovered: false });
          break;

        default:
          break;
      }

      if (plan.currentStep < plan.steps.length) {
        plan.steps[plan.currentStep].status = 'completed';
        plan.currentStep++;
        if (plan.currentStep < plan.steps.length) {
          plan.steps[plan.currentStep].status = 'running';
        }
        this.memory.setWorkingData('plan', plan);
      }
    }

    return this.buildErrorResult(
      lastError ?? `达到最大迭代次数(${this.config.maxIterations})`,
      iteration,
      context
    );
  }

  private async callLLMWithTimeout(
    messages: any[],
    options: any,
    timeoutMs: number
  ): Promise<string> {
    return Promise.race([
      aiService.callAIWithRetry(messages, options),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error(`LLM调用超时(${timeoutMs}ms)`)), timeoutMs)
      ),
    ]);
  }

  private async executeToolWithTimeout(
    toolName: string,
    params: Record<string, any>,
    context: AgentContext,
    timeoutMs: number
  ): Promise<ToolResult> {
    return Promise.race([
      toolSystem.execute(toolName, params, context),
      new Promise<ToolResult>((_, reject) =>
        setTimeout(() => reject(new Error(`工具执行超时(${timeoutMs}ms)`)), timeoutMs)
      ),
    ]);
  }

  private buildReActPrompt(context: AgentContext, iteration: number): string {
    const toolsDesc = toolSystem.getToolDescriptions();
    const recentMessages = this.memory
      .getRecentMessages(10)
      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n');
    const wm = this.memory.getWorkingMemory();

    const projectInfo = `
## NanoEdit Pro 项目实时状态
- 轨道数: ${context.projectState.tracks.length} (${context.projectState.tracks.map(t => t.type).join(', ')})
- 片段数: ${context.projectState.clipsCount}
- 素材数: ${context.projectState.assetsCount}
- 当前时间: ${context.projectState.currentTime}s
- 总时长: ${context.projectState.totalDuration}s
- 画布: ${context.projectState.canvasSize.width}x${context.projectState.canvasSize.height}
- 帧率: ${context.projectState.fps}fps

## 用户需求
"${context.userInput}"

## 工作记忆
${wm.analysis ? `- 需求分析: ${JSON.stringify(wm.analysis).slice(0, 300)}` : ''}
${wm.shotData ? `- 分镜数据: 已生成 (${Object.keys(wm.shotData).length} keys)` : ''}
${wm.textLines ? `- 文案拆分: ${wm.textLines.length} 条短句` : ''}
${wm.imagePrompts ? `- 图片提示词: ${wm.imagePrompts.length} 组` : ''}
${wm.addedClipIds ? `- 已添加片段: ${wm.addedClipIds.length} 个 (IDs: ${wm.addedClipIds.join(', ')})` : ''}
${wm.customPresets ? `- 自定义预设: ${wm.customPresets.length} 个` : ''}

## 近期对话历史
${recentMessages || '(无)'}`;

    return `${SYSTEM_PROMPTS.REACT_SYSTEM}

## 可用工具
${toolsDesc}

${projectInfo}

## 执行格式要求
你必须严格按以下格式输出，每次只输出一个动作:

Thought: [你的思考过程，分析当前情况]
Action: 工具名{"参数1": "值1", "参数2": "值2"}

或者当所有任务完成后:

Finish: [最终输出总结]

注意:
1. 每次只能执行一个 Action
2. 必须先 Thought 再 Action
3. 参数必须是有效的 JSON 格式
4. 如果工具返回错误，尝试用不同参数重试或换其他方式
5. 完成所有步骤后必须使用 Finish 结束
6. 优先使用项目中已有的素材(use_project_asset)，不足时再生成(generate_asset_with_ai)
7. 要创建完整的视频，需要在轨道上添加：背景素材/视频、文字标题、副标题、动画效果等
8. 使用 batch_add_clips 可以一次性批量添加多个片段
9. 你是 NanoEdit Pro 的专属 AI，要充分利用项目提供的所有功能

这是第 ${iteration} 次迭代。请继续执行计划。`;
  }

  private parseLLMResponse(response: string): LoopAction {
    const thoughtMatch = response.match(/Thought:\s*(.+?)(?=\n(?:Action|Finish|Observe)|$)/is);
    const actionMatch = response.match(/Action:\s*(\w+)\s*(\{[^}]*\})?/i);
    const finishMatch = response.match(/Finish:\s*(.+?)(?:\n|$)/is);
    const errorMatch = response.match(/Error:\s*(.+?)(?:\n|$)/is);

    if (errorMatch) {
      return { type: 'error', error: errorMatch[1].trim() };
    }
    if (finishMatch) {
      return { type: 'finish', output: finishMatch[1].trim() };
    }
    if (actionMatch && actionMatch[1]) {
      const toolName = actionMatch[1];
      let params: Record<string, any> = {};
      try {
        if (actionMatch[2]) {
          params = JSON.parse(actionMatch[2]);
        }
      } catch {
        params = {};
      }
      const reasoning = thoughtMatch ? thoughtMatch[1].trim() : '';
      return { type: 'act', tool: toolName, params, reasoning };
    }
    if (thoughtMatch) {
      return { type: 'think', thought: thoughtMatch[1].trim() };
    }

    if (response.includes('完成') || response.includes('结束') || response.includes('Finish')) {
      return { type: 'finish', output: response.replace(/.*?(?=完成|结束|Finish)/is, '').slice(0, 500) };
    }

    return { type: 'think', thought: response.slice(0, 500) };
  }

  private async reflect(
    context: AgentContext,
    step: number
  ): Promise<ReflectionEntry> {
    const errors = this.memory.getErrors().slice(-3);
    const reflections = this.memory.getReflections();

    const reflectPrompt = `你在视频生成过程中遇到了错误。请分析并给出修正方案。

## 最近的错误:
${errors.map((e, i) => `${i + 1}. 步骤${e.step}, 工具: ${e.tool}, 错误: ${e.error}`).join('\n')}

## 历史反思:
${reflections.map((r, i) => `${i + 1}. 步骤${r.step}: ${r.observation} → ${r.action}${r.correction ? ` → 修正: ${r.correction}` : ''}`).join('\n') || '(无)'}

## 项目状态:
片段已添加: ${this.memory.getWorkingData('addedClipIds')?.length ?? 0} 个

请以 JSON 格式返回:
{
  "observation": "观察到的问题",
  "thought": "分析原因",
  "action": "建议的下一步操作",
  "correction": "具体的修正方案（如果需要修正参数或换工具）"
}`;

    try {
      const result = await this.callLLMWithTimeout([
        { role: 'user', content: reflectPrompt },
      ], {}, 30000);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      const entry: ReflectionEntry = {
        step,
        observation: parsed.observation ?? errors.map(e => e.error).join('; '),
        thought: parsed.thought ?? '',
        action: parsed.action ?? '',
        correction: parsed.correction,
      };

      this.memory.addReflection(entry);
      return entry;
    } catch {
      const entry: ReflectionEntry = {
        step,
        observation: errors.map(e => e.error).join('; '),
        thought: '无法进行自动反思',
        action: '继续执行',
      };
      this.memory.addReflection(entry);
      return entry;
    }
  }

  private formatObservation(result: ToolResult): string {
    if (result.success) {
      const dataStr = typeof result.data === 'object'
        ? JSON.stringify(result.data).slice(0, 400)
        : String(result.data ?? '').slice(0, 400);
      return `成功: ${dataStr}`;
    }
    return `失败: ${result.error}`;
  }

  private generateInitialPlan(userInput: string): AgentPlan {
    return {
      goal: userInput,
      currentStep: 0,
      steps: [
        {
          id: 'step_1',
          action: 'list_project_resources',
          reasoning: '首先了解项目中有哪些可用资源（素材、模板、预设等）',
          params: { resourceType: 'all' },
          expectedOutcome: '项目资源完整列表',
          status: 'pending',
        },
        {
          id: 'step_2',
          action: 'analyze_user_input',
          reasoning: '分析用户输入，提取素材需求、分镜描述和文案',
          params: { userInput },
          expectedOutcome: '结构化的分析结果',
          dependsOn: ['step_1'],
          status: 'pending',
        },
        {
          id: 'step_3',
          action: 'generate_shot_data',
          reasoning: '基于分析结果生成分镜数据',
          params: {},
          expectedOutcome: '完整的 AIScript JSON 分镜数据',
          dependsOn: ['step_2'],
          status: 'pending',
        },
        {
          id: 'step_4',
          action: 'batch_add_clips',
          reasoning: '使用批量添加一次性创建完整的视频结构',
          params: {},
          expectedOutcome: '多个片段已添加到项目轨道',
          dependsOn: ['step_3'],
          status: 'pending',
        },
        {
          id: 'step_5',
          action: 'apply_preset_effect',
          reasoning: '为片段应用动画效果',
          params: {},
          expectedOutcome: '所有片段都有合适的动画效果',
          dependsOn: ['step_4'],
          status: 'pending',
        },
      ],
    };
  }

  private buildSuccessResult(output: string, stepsExecuted: number, context: AgentContext): AgentResult {
    const wm = this.memory.getWorkingMemory();
    return {
      success: true,
      finalOutput: output,
      stepsExecuted,
      plan: wm.plan,
      workingMemory: wm,
      conversationHistory: this.memory.getAllMessages(),
      suggestions: [
        '可以在时间轴上调整片段位置和时长',
        '双击片段可编辑详细属性',
        '可在效果面板中更换动画预设',
        '点击"导出"按钮渲染最终视频',
      ],
    };
  }

  private buildErrorResult(error: string, stepsExecuted: number, context: AgentContext, extraMsg?: string): AgentResult {
    const wm = this.memory.getWorkingMemory();
    return {
      success: false,
      stepsExecuted,
      workingMemory: wm,
      conversationHistory: this.memory.getAllMessages(),
      error: extraMsg ? `${extraMsg}: ${error}` : error,
      suggestions: this.generateSuggestions(),
    };
  }

  private generateSuggestions(): string[] {
    const wm = this.memory.getWorkingMemory();
    const suggestions: string[] = [];
    if (!wm.analysis) suggestions.push('尝试更详细的描述你的视频需求');
    if (wm.errors.length > 0) suggestions.push('上次生成遇到问题，可以尝试重新生成');
    if (wm.addedClipIds && wm.addedClipIds.length > 0) {
      suggestions.push(`${wm.addedClipIds.length} 个片段已添加到轨道，可继续添加更多内容`);
    }
    suggestions.push('可以使用自然语言追问修改，如"把字号改大一点"');
    return suggestions;
  }
}

export { ReActPlanner };
export default ReActPlanner;
