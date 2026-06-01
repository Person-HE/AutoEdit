import {
  WorkingMemory,
  ReflectionEntry,
  ErrorEntry,
  Message,
  ToolResult,
} from '../core/AgentTypes';

interface EpisodicEntry {
  id: string;
  timestamp: number;
  summary: string;
  userInput: string;
  resultSummary: string;
  tags: string[];
}

interface MemoryConfig {
  maxWorkingMemoryEntries?: number;
  maxConversationLength?: number;
}

class AgentMemory {
  private config: Required<MemoryConfig>;
  conversationHistory: Message[] = [];
  workingMemory: WorkingMemory = {
    reflections: [],
    errors: [],
  };
  private episodicMemory: EpisodicEntry[] = [];

  constructor(config: MemoryConfig = {}) {
    this.config = {
      maxWorkingMemoryEntries: config.maxWorkingMemoryEntries ?? 50,
      maxConversationLength: config.maxConversationLength ?? 100,
    };
  }

  addUserMessage(content: string): void {
    this.conversationHistory.push({
      role: 'user',
      content,
      timestamp: Date.now(),
    });
    this.trimIfNeeded();
  }

  addAssistantMessage(
    content: string,
    toolCall?: { toolName: string; params: Record<string, any>; reasoning?: string },
    toolResult?: ToolResult
  ): void {
    this.conversationHistory.push({
      role: 'assistant',
      content,
      timestamp: Date.now(),
      toolCall,
      toolResult,
    });
    this.trimIfNeeded();
  }

  addSystemMessage(content: string): void {
    this.conversationHistory.push({
      role: 'system',
      content,
      timestamp: Date.now(),
    });
    this.trimIfNeeded();
  }

  addToolMessage(toolName: string, result: ToolResult): void {
    const content = result.success
      ? `工具 ${toolName} 执行成功: ${JSON.stringify(result.data ?? {}).slice(0, 500)}`
      : `工具 ${toolName} 执行失败: ${result.error}`;
    this.conversationHistory.push({
      role: 'tool',
      content,
      timestamp: Date.now(),
      toolResult: result,
    });
    this.trimIfNeeded();
  }

  getRecentMessages(count = 20): Message[] {
    return this.conversationHistory.slice(-count);
  }

  getAllMessages(): Message[] {
    return [...this.conversationHistory];
  }

  getConversationSummary(): string {
    if (this.conversationHistory.length === 0) return '(空对话)';
    const userMsgs = this.conversationHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content.slice(0, 100));
    const assistantMsgs = this.conversationHistory
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content.slice(0, 100));
    return `[用户消息(${userMsgs.length}条)]: ${userMsgs.join(' | ')}\n[助手回复(${assistantMsgs.length}条)]: ${assistantMsgs.join(' | ')}`;
  }

  clearConversation(): void {
    this.conversationHistory = [];
  }

  setWorkingData<K extends keyof WorkingMemory>(key: K, value: any): void {
    (this.workingMemory as any)[key] = value;
  }

  getWorkingData<K extends keyof WorkingMemory>(key: K): WorkingMemory[K] | undefined {
    return this.workingMemory[key];
  }

  updateWorkingMemory(partial: Partial<WorkingMemory>): void {
    Object.assign(this.workingMemory, partial);
  }

  getWorkingMemory(): WorkingMemory {
    return { ...this.workingMemory };
  }

  clearWorkingMemory(): void {
    this.workingMemory = { reflections: [], errors: [] };
  }

  addReflection(entry: ReflectionEntry): void {
    this.workingMemory.reflections.push(entry);
    if (this.workingMemory.reflections.length > this.config.maxWorkingMemoryEntries) {
      this.workingMemory.reflections.shift();
    }
  }

  getReflections(): ReflectionEntry[] {
    return [...this.workingMemory.reflections];
  }

  getLastReflection(): ReflectionEntry | undefined {
    const refs = this.workingMemory.reflections;
    return refs.length > 0 ? refs[refs.length - 1] : undefined;
  }

  hasRecentError(): boolean {
    if (this.workingMemory.errors.length === 0) return false;
    const lastErr = this.workingMemory.errors[this.workingMemory.errors.length - 1];
    return !lastErr.recovered;
  }

  addError(error: ErrorEntry): void {
    this.workingMemory.errors.push(error);
  }

  getErrors(): ErrorEntry[] {
    return [...this.workingMemory.errors];
  }

  clearErrors(): void {
    this.workingMemory.errors = [];
  }

  saveEpisode(summary: string, result: any): void {
    const lastUserMsg = [...this.conversationHistory].reverse().find((m) => m.role === 'user');
    this.episodicMemory.push({
      id: `ep_${Date.now()}`,
      timestamp: Date.now(),
      summary,
      userInput: lastUserMsg?.content ?? '',
      resultSummary: typeof result === 'string' ? result : JSON.stringify(result).slice(0, 200),
      tags: this.extractTags(summary),
    });
    if (this.episodicMemory.length > 50) this.episodicMemory.shift();
  }

  getRelevantEpisodes(query: string): EpisodicEntry[] {
    const q = query.toLowerCase();
    return this.episodicMemory
      .filter((e) => e.summary.toLowerCase().includes(q) || e.userInput.toLowerCase().includes(q))
      .slice(-5);
  }

  buildContextWindow(maxTokens = 8000): Message[] {
    const systemMessages = this.conversationHistory.filter((m) => m.role === 'system');
    const recentMessages = this.getRecentMessages(this.config.maxConversationLength);
    let totalChars = systemMessages.reduce((sum, m) => sum + m.content.length, 0)
      + recentMessages.reduce((sum, m) => sum + m.content.length, 0);

    if (totalChars <= maxTokens * 3) {
      return [...systemMessages, ...recentMessages];
    }
    const compressed: Message[] = [
      ...systemMessages,
      {
        role: 'system',
        content: `[早期对话摘要]\n${this.getConversationSummary()}`,
        timestamp: Date.now(),
      },
    ];
    let charsSoFar = compressed.reduce((sum, m) => sum + m.content.length, 0);
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msgLen = recentMessages[i].content.length;
      if (charsSoFar + msgLen > maxTokens * 3) break;
      compressed.unshift(recentMessages[i]);
      charsSoFar += msgLen;
    }
    return compressed;
  }

  serialize(): string {
    return JSON.stringify({
      conversationCount: this.conversationHistory.length,
      episodicCount: this.episodicMemory.length,
      workingMemory: this.workingMemory,
    }, null, 2);
  }

  private trimIfNeeded(): void {
    while (this.conversationHistory.length > this.config.maxConversationLength) {
      this.conversationHistory.shift();
    }
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const keywords = ['产品', '宣传', '教程', '美食', '科技', '品牌', '代码', '动画', '音乐', '风景'];
    for (const kw of keywords) {
      if (text.includes(kw)) tags.push(kw);
    }
    return tags;
  }
}

export { AgentMemory };
export default AgentMemory;
