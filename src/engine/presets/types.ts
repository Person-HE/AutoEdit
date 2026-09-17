export interface EffectParam {
  key: string;
  label: string;
  type: 'number' | 'color' | 'text' | 'select' | 'string' | 'boolean';
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface TransformState {
  x: number;
  y: number;
  scale: number;
  rotation: number; // 与 Clip.transform 的字段名保持一致
  skewX?: number;
  skewY?: number;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
}

export interface PresetResult {
  transform: TransformState;
  opacity: number;
  filter?: string;
  /** 转场类预设可用的 CSS clip-path（如划像遮罩） */
  clipPath?: string;
}

export interface PresetDefinition {
  id: string;
  name: string;
  description?: string;
  category: 'entrance' | 'exit' | 'text' | 'emphasis' | 'motion' | 'fx' | 'transition';
  quality?: string;
  mood?: string;
  material?: string;
  dimensions?: Record<string, boolean>;
  physics?: string[];
  schema: EffectParam[];
  apply: (progress: number, params: Record<string, any>, currentTransform: TransformState) => PresetResult;
}
