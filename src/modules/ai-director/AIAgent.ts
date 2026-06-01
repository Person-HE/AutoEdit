import { AgentResult, AgentConfig, AgentStatus, AgentContext, ProjectSnapshot, Message, WorkingMemory } from './core/AgentTypes';
import { ReActPlanner } from './planner/ReActPlanner';
import { AgentMemory } from './memory/AgentMemory';
import { useProjectStore } from '../../store/useProjectStore';
import { useAssetStore } from '../asset/useAssetStore';
import './tools/index.ts';

interface AIAgentConfig extends AgentConfig {
  onStatusChange?: (status: AgentStatus, message?: string) => void;
  onStepComplete?: (step: number, action: string) => void;
}

class AIAgent {
  private memory: AgentMemory;
  private planner: ReActPlanner;
  private config: Required<AIAgentConfig> & { onStatusChange?: (status: AgentStatus, message?: string) => void; onStepComplete?: (step: number, action: string) => void };

  constructor(config: AIAgentConfig = {}) {
    this.config = {
      maxIterations: config.maxIterations ?? 20,
      maxReflections: config.maxReflections ?? 3,
      enableSelfCorrection: config.enableSelfCorrection ?? true,
      verbose: config.verbose ?? false,
      temperature: config.temperature ?? 0.7,
      onStatusChange: config.onStatusChange,
      onStepComplete: config.onStepComplete,
    };
    this.memory = new AgentMemory();
    this.planner = new ReActPlanner(this.memory, this.config);
  }

  async generate(userInput: string, options?: { onStatusChange?: (status: AgentStatus, message?: string) => void }): Promise<AgentResult> {
    const onStatusChange = options?.onStatusChange || this.config.onStatusChange;
    this.setStatus('thinking', '正在初始化 AI 导演智能体...');
    this.memory.clearConversation();
    this.memory.addUserMessage(userInput);

    const projectSnapshot = this.captureProjectState();

    const context: AgentContext = {
      userInput,
      conversationHistory: [],
      workingMemory: this.memory.getWorkingMemory(),
      projectState: projectSnapshot,
      config: this.config,
    };

    try {
      this.setStatus('acting', 'AI导演正在分析需求并执行...');
      const result = await this.planner.run(context);

      if (result.success) {
        this.setStatus('done', result.finalOutput || '视频生成完成！');
        this.memory.addAssistantMessage(result.finalOutput || '视频生成完成');
      } else {
        this.setStatus('error', result.error || '生成过程中遇到错误');
        this.memory.addAssistantMessage(`抱歉，生成失败：${result.error}`);
      }

      return result;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      this.setStatus('error', errMsg);
      return {
        success: false,
        stepsExecuted: 0,
        workingMemory: this.memory.getWorkingMemory(),
        conversationHistory: this.memory.getAllMessages(),
        error: errMsg,
      };
    }
  }

  async followUp(userInput: string, options?: { onStatusChange?: (status: AgentStatus, message?: string) => void }): Promise<AgentResult> {
    const onStatusChange = options?.onStatusChange || this.config.onStatusChange;
    this.memory.addUserMessage(userInput);
    this.setStatus('thinking', `处理追问: "${userInput.slice(0, 30)}..."`);

    const wm = this.memory.getWorkingData('shotData');
    const hasExistingContent = !!(wm?.shots?.length > 0 || this.memory.getWorkingData('addedClipIds')?.length > 0);

    let systemPrompt: string;
    if (hasExistingContent) {
      systemPrompt = `用户对已生成的视频内容提出了修改要求。请根据用户的修改意见调整。

## 当前工作状态:
- 分镜数据: ${wm ? '已存在' : '无'}
- 已添加片段: ${this.memory.getWorkingData('addedClipIds')?.length ?? 0} 个
- 最近错误: ${this.memory.getErrors().length} 个

你可以:
1. 使用 add_clip_to_track 添加新片段
2. 使用 apply_preset_effect 修改动画效果
3. 如果需要重新生成，可以再次调用 analyze_user_input 或 generate_shot_data

请直接使用工具满足用户的需求。`;
      this.memory.addSystemMessage(systemPrompt);
    }

    const projectSnapshot = this.captureProjectState();
    const context: AgentContext = {
      userInput,
      conversationHistory: this.memory.buildContextWindow(4000),
      workingMemory: this.memory.getWorkingMemory(),
      projectState: projectSnapshot,
      config: { ...this.config, maxIterations: 10 },
    };

    this.setStatus('acting', '正在处理修改请求...');

    try {
      const result = await this.planner.run(context);
      if (result.success) {
        this.setStatus('done', result.finalOutput || '修改完成！');
      } else {
        this.setStatus('error', result.error || '修改失败');
      }
      return result;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      this.setStatus('error', errMsg);
      return {
        success: false,
        stepsExecuted: 0,
        workingMemory: this.memory.getWorkingMemory(),
        conversationHistory: this.memory.getAllMessages(),
        error: errMsg,
      };
    }
  }

  getConversationHistory(): Message[] {
    return this.memory.getAllMessages();
  }

  getWorkingMemory(): WorkingMemory {
    return this.memory.getWorkingMemory();
  }

  reset(): void {
    this.memory.clearConversation();
    this.memory.clearWorkingMemory();
  }

  private setStatus(status: AgentStatus, message?: string): void {
    this.config.onStatusChange?.(status, message);
  }

  private captureProjectState(): ProjectSnapshot {
    const projectState = useProjectStore.getState();
    const assetState = useAssetStore.getState();

    return {
      tracks: (projectState.project.tracks || []).map((t) => ({
        id: t.id,
        type: t.type,
        name: t.name,
      })),
      clipsCount: Object.keys(projectState.project.clips || {}).length,
      assetsCount: (assetState.assets || []).length,
      currentTime: 0, // currentTime is in UIStore, not ProjectState
      totalDuration: projectState.project.duration ?? 30,
      canvasSize: {
        width: projectState.project.width ?? 1920,
        height: projectState.project.height ?? 1080,
      },
      fps: projectState.project.fps ?? 30,
    };
  }
}

export const aiAgent = new AIAgent();
export { AIAgent };
export default aiAgent;
