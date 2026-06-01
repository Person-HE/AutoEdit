// 核心数据模型 (Core Data Models)
// 注意：所有核心类型已从 src/modules/shared/types.ts 统一导出
// 请优先使用 src/modules/shared/types.ts 中的类型定义

export type {
  Transform,
  EffectPreset,
  EffectParamSchema,
  Effect,
  Asset,
  VoiceOver,
  TextData,
  TemplateData,
  ClipStyle,
  Clip,
  Track,
  Project,
  UIState,
} from '../modules/shared/types';

// 画板类型定义 (这些类型是 core.ts 独有的，保留在此)
export type DrawingTool =
  | 'brush'
  | 'eraser'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'selection'
  | 'text'
  | 'image';

export interface DrawingPoint {
  x: number;
  y: number;
  pressure: number;
}

export interface DrawingElement {
  id: string;
  type: DrawingTool | 'free_draw';
  x: number;
  y: number;
  width: number;
  height: number;
  points?: DrawingPoint[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fillStyle: 'solid' | 'none' | 'hachure' | 'cross-hatch';
  opacity: number;
  angle: number;
  cornerRadius: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  imageUrl?: string;
  roughness: number;
  layerId: string;
  visible: boolean;
  locked: boolean;
}

export interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface DrawingFrame {
  id: string;
  name: string;
  elements: DrawingElement[];
  visible: boolean;
}

export interface DrawingProject {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: DrawingLayer[];
  activeLayerId: string;
  frames: DrawingFrame[];
  activeFrameIndex: number;
  currentTool: DrawingTool;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  fillColor: string;
  fillStyle: 'solid' | 'none' | 'hachure' | 'cross-hatch';
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  strokeSharpness: 'round' | 'sharp';
  fps: number;
  createdAt: number;
  updatedAt: number;
}
