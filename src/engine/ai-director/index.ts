/**
 * AI 导演模式模块
 * 核心功能：AI 脚本解析、项目构建、素材生成
 */

// 网格系统
export { 
  GridSystem, 
  getGridSystem, 
  resetGridSystem, 
  CANVAS_CONFIG, 
  GRID_CONFIG,
  SPECIAL_GRID_MAP 
} from './GridSystem';
export type { 
  GridId, 
  PixelRange, 
  GridMetadata, 
  ParsedGrid, 
  ValidationResult 
} from './GridSystem';

// 向后兼容
export { getGridSystem as getGrid9x9System, resetGridSystem as resetGrid9x9System } from './GridSystem';

export { AIScriptValidator } from './AIScriptValidator';

export { ProjectBuilder, buildProjectFromScript } from './ProjectBuilder';
export type { BuildProgressCallback, ProjectBuilderConfig } from './ProjectBuilder';

export type {
  AIScript,
  Shot,
  TextElement,
  MaterialElement,
  AnimationRef,
  BackgroundConfig,
  TransitionConfig,
  ValidationError,
  ScriptValidationResult,
  BuildProgress,
  BuildResult,
  BuiltShot,
} from './AIScriptSchema';

export { getExampleScript } from './AIScriptSchema';
