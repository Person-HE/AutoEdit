export type AgentStatus = 'idle' | 'thinking' | 'acting' | 'reflecting' | 'done' | 'error';

export interface AgentTool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>, context: AgentContext) => Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  enum?: string[];
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  userInput: string;
  conversationHistory: Message[];
  workingMemory: WorkingMemory;
  projectState: ProjectSnapshot;
  config: AgentConfig;
}

export interface ProjectSnapshot {
  tracks: Array<{ id: string; type: string; name: string }>;
  clipsCount: number;
  assetsCount: number;
  currentTime: number;
  totalDuration: number;
  canvasSize: { width: number; height: number };
  fps: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  toolCall?: ToolCallInfo;
  toolResult?: ToolResult;
}

export interface ToolCallInfo {
  toolName: string;
  params: Record<string, any>;
  reasoning?: string;
}

export interface WorkingMemory {
  analysis?: any;
  contentDesign?: any;
  viralCheck?: any;
  shotData?: any;
  textLines?: any[];
  imagePrompts?: any[];
  addedClipIds?: string[];
  customPresets?: string[];
  plan?: AgentPlan;
  reflections: ReflectionEntry[];
  errors: ErrorEntry[];
}

export interface ReflectionEntry {
  step: number;
  observation: string;
  thought: string;
  action: string;
  correction?: string;
}

export interface ErrorEntry {
  step: number;
  tool: string;
  error: string;
  recovered: boolean;
}

export interface AgentPlan {
  goal: string;
  steps: PlanStep[];
  currentStep: number;
}

export interface PlanStep {
  id: string;
  action: string;
  reasoning: string;
  params: Record<string, any>;
  expectedOutcome: string;
  dependsOn?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

export interface AgentConfig {
  maxIterations?: number;
  maxReflections?: number;
  enableSelfCorrection?: boolean;
  verbose?: boolean;
  temperature?: number;
}

export interface AgentResult {
  success: boolean;
  finalOutput?: string;
  stepsExecuted: number;
  plan?: AgentPlan;
  workingMemory: WorkingMemory;
  conversationHistory: Message[];
  error?: string;
  suggestions?: string[];
}
