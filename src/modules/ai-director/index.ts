// AI Director 模块导出

// ====== AI Agent (智能体) ======
export { AIAgent, aiAgent } from './AIAgent';
export type {
  AgentStatus,
  AgentTool,
  ToolResult,
  AgentContext,
  ProjectSnapshot,
  Message,
  WorkingMemory,
  ReflectionEntry,
  ErrorEntry,
  AgentPlan,
  PlanStep,
  AgentConfig,
  AgentResult,
} from './core/AgentTypes';
export { toolSystem, ToolSystem } from './core/ToolSystem';

// Services
export { AIService, aiService } from './services/AIService';
export { AIDirectorService, aiDirectorService, generateAIVideo } from './services/AIDirectorService';
export type { AIDirectorProgress, AIDirectorResult } from './services/AIDirectorService';

// Prompts
export { SYSTEM_PROMPTS, ENTRANCE_PRESETS_LIST, EXIT_PRESETS_LIST, LAYOUT_SYSTEM, getSystemPrompt } from './prompts/systemPrompts';
export { getAvailablePresetsText, buildShotDataPrompt } from './prompts/promptTemplates';

// Adapters
export { projectAdapter } from './adapters/ProjectAdapter';
export type { AddClipInput } from './adapters/ProjectAdapter';

// Memory
export { AgentMemory } from './memory/AgentMemory';

// Planner
export { ReActPlanner } from './planner/ReActPlanner';

// Tools
export { analyzeTool } from './tools/AnalyzeTool';
export { promptGeneratorTool } from './tools/PromptGeneratorTool';
export { shotGeneratorTool } from './tools/ShotGeneratorTool';
export { textProcessorTool } from './tools/TextProcessorTool';
export { addClipTool } from './tools/AddClipTool';
export { addAssetTool } from './tools/AddAssetTool';
export { useAssetTool } from './tools/UseAssetTool';
export { useTemplateTool } from './tools/UseTemplateTool';
export { batchAddTool } from './tools/BatchAddTool';
export { generateAssetTool } from './tools/GenerateAssetTool';
export { applyEffectTool } from './tools/ApplyEffectTool';
export { createPresetTool } from './tools/CreatePresetTool';
export { removeEffectTool } from './tools/RemoveEffectTool';
export { manageTrackTool } from './tools/ManageTrackTool';
export { trackVisibilityTool } from './tools/TrackVisibilityTool';
export { updateClipTool } from './tools/UpdateClipTool';
export { removeClipTool } from './tools/RemoveClipTool';
export { moveClipTool } from './tools/MoveClipTool';
export { duplicateClipTool } from './tools/DuplicateClipTool';
export { projectSettingsTool } from './tools/ProjectSettingsTool';
export { exportVideoTool } from './tools/ExportVideoTool';
export { observeProjectTool } from './tools/ObserveProjectTool';
export { listResourcesTool } from './tools/ListResourcesTool';

// Schema
export type {
  AIScriptSchema,
  AIScene,
  AIElement,
  AIAnimation,
  AITransition,
  AIAssetReference,
} from './schema/AIScriptSchema';
export { SCHEMA_VALIDATION_RULES } from './schema/AIScriptSchema';
export { aiscriptValidator } from './schema/AIScriptValidator';
export type { ValidationResult, ValidationError, ValidationWarning } from './schema/AIScriptValidator';
