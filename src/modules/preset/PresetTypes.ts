import React from 'react';
import { EffectParamSchema, Transform } from '../../types/core';
import type { PresetDefinition as LegacyPresetDefinition } from '../../engine/presets/types';

export enum EffectRenderMode {
  CANVAS_2D = 'canvas2d',
  REACT = 'react',
  HYBRID = 'hybrid'
}

export interface ReactEffectProps {
  progress: number;
  params: Record<string, any>;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export type PresetCategory = 'entrance' | 'exit' | 'emphasis' | 'motion' | 'fx' | 'transition' | 'text';

export interface AnimationEffect extends Omit<LegacyPresetDefinition, 'apply'> {
  renderMode: EffectRenderMode;
  apply: (progress: number, params: any, currentTransform: Transform, ctx?: CanvasRenderingContext2D) => {
    transform: Transform;
    opacity: number;
    filter?: string;
  };
  reactRender?: (props: ReactEffectProps) => React.ReactElement;
  gpuSafeProps: string[];
}

export type PresetRenderFn = (
  params: Record<string, any>,
  progress: number
) => {
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  opacity: number;
};

export interface PresetRegistryItem {
  preset: AnimationEffect;
  renderFn: PresetRenderFn;
}

export interface PresetRegistryState {
  presets: Map<string, PresetRegistryItem>;
  categories: Map<PresetCategory, string[]>;
}

export interface ApplyPresetConfig {
  clipId: string;
  presetId: string;
  params?: Record<string, any>;
  duration?: number;
}
