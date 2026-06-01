import { Transform, Clip, Track, Effect } from '../../types/core';

export type GridPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type ZDepthLayer = 'background' | 'middle-ground' | 'foreground' | 'text';

export interface SemanticPosition {
  grid: GridPosition;
  layer: ZDepthLayer;
  offsetX?: number;
  offsetY?: number;
}

export interface Shot {
  id: string;
  sceneId: string;
  text: string;
  visual: VisualDescription;
  duration: number;
  clips: GeneratedClip[];
}

export interface Scene {
  id: string;
  name: string;
  shots: Shot[];
  totalDuration: number;
}

export interface VisualDescription {
  type: 'comfyui' | 'svg' | 'library' | 'color';
  prompt?: string;
  svgCode?: string;
  assetId?: string;
  color?: string;
  position: SemanticPosition;
  effects: EffectInstruction[];
  transition?: TransitionInstruction;
}

export interface EffectInstruction {
  presetId: string;
  params: Record<string, any>;
  intensity?: 'low' | 'medium' | 'high';
}

export interface TransitionInstruction {
  type: 'cut' | 'fade' | 'wipe' | 'dissolve';
  duration: number;
}

export interface GeneratedClip {
  clipId: string;
  type: 'video' | 'image' | 'audio' | 'text';
  trackId: string;
  startTime: number;
  duration: number;
  transform: Transform;
  assetId?: string;
  effects: Effect[];
}

export interface ADEProject {
  scenes: Scene[];
  totalDuration: number;
  tracks: TrackConfig[];
}

export interface TrackConfig {
  id: string;
  type: 'video' | 'audio' | 'text';
  name: string;
  zIndex: number;
}

export interface ScriptParseResult {
  scenes: Scene[];
  totalDuration: number;
  metadata: {
    title?: string;
    style?: string;
    mood?: string;
  };
}

export interface LayoutResult {
  transform: Transform;
  zIndex: number;
  collisions: string[];
}

export interface AssetGenerationResult {
  assetId: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  duration?: number;
  width?: number;
  height?: number;
}

export interface ComfyUIConfig {
  enabled: boolean;
  host: string;
  port: number;
  workflows: Record<string, any>;
}

export interface ADEConfig {
  layout: {
    gridColumns: number;
    gridRows: number;
    padding: number;
  };
  timing: {
    minShotDuration: number;
    maxShotDuration: number;
  };
  effects: {
    defaultIntensity: 'low' | 'medium' | 'high';
    enableTransitions: boolean;
  };
  comfyui: ComfyUIConfig;
}

export const DEFAULT_ADE_CONFIG: ADEConfig = {
  layout: {
    gridColumns: 3,
    gridRows: 3,
    padding: 50
  },
  timing: {
    minShotDuration: 1,
    maxShotDuration: 30
  },
  effects: {
    defaultIntensity: 'medium',
    enableTransitions: true
  },
  comfyui: {
    enabled: false,
    host: '127.0.0.1',
    port: 8188,
    workflows: {}
  }
};
