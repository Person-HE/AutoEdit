// AI 脚本 Schema 定义
export interface AIScriptSchema {
  version: string;
  meta: {
    title: string;
    author?: string;
    createdAt: number;
    style?: string;
    duration?: number;
  };
  scenes: AIScene[];
  globalSettings: {
    fps: number;
    resolution: { width: number; height: number };
    backgroundColor?: string;
  };
  assets: AIAssetReference[];
}

export interface AIScene {
  id: string;
  order: number;
  title: string;
  description: string;
  duration: number;
  startTime: number;
  elements: AIElement[];
  transitions?: {
    in?: AITransition;
    out?: AITransition;
  };
}

export interface AIElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'effect';
  content?: string;
  assetId?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  transform: {
    scale: number;
    rotation: number;
    opacity: number;
  };
  animation?: AIAnimation;
  timing: {
    startOffset: number;
    duration: number;
  };
}

export interface AIAnimation {
  presetId: string;
  params: Record<string, any>;
  easing?: string;
}

export interface AITransition {
  type: 'fade' | 'slide' | 'wipe' | 'zoom';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface AIAssetReference {
  id: string;
  type: 'image' | 'video' | 'audio';
  source: string;
  description?: string;
}

// Schema 验证规则
export const SCHEMA_VALIDATION_RULES = {
  requiredFields: ['version', 'meta', 'scenes', 'globalSettings'],
  sceneRequiredFields: ['id', 'order', 'title', 'duration', 'elements'],
  elementRequiredFields: ['id', 'type', 'position', 'size', 'timing'],
};
