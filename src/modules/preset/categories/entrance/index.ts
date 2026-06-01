import { AnimationEffect, EffectRenderMode } from '../../PresetTypes';
import type { PresetDefinition } from '../../../../engine/presets/types';
import {
  bounceIn,
  slideInLeft,
  fadeIn,
  rotateIn,
  slideInRight,
  zoomIn,
  zoomInUp,
  zoomInDown,
  elasticIn,
  backIn,
  flipInX,
  flipInY,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  slideInDown,
  slideInUp
} from '../../../../engine/presets/entrance';

function adaptLegacyPreset(legacyPreset: PresetDefinition, renderMode: EffectRenderMode = EffectRenderMode.CANVAS_2D): AnimationEffect {
  return {
    ...legacyPreset,
    renderMode,
    gpuSafeProps: legacyPreset.schema.map(param => param.key)
  };
}

export {
  bounceIn,
  slideInLeft,
  fadeIn,
  rotateIn,
  slideInRight,
  zoomIn,
  zoomInUp,
  zoomInDown,
  elasticIn,
  backIn,
  flipInX,
  flipInY,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  slideInDown,
  slideInUp
};

export const entrancePresets: AnimationEffect[] = [
  adaptLegacyPreset(bounceIn),
  adaptLegacyPreset(slideInLeft),
  adaptLegacyPreset(fadeIn),
  adaptLegacyPreset(rotateIn),
  adaptLegacyPreset(slideInRight),
  adaptLegacyPreset(zoomIn),
  adaptLegacyPreset(zoomInUp),
  adaptLegacyPreset(zoomInDown),
  adaptLegacyPreset(elasticIn),
  adaptLegacyPreset(backIn),
  adaptLegacyPreset(flipInX),
  adaptLegacyPreset(flipInY),
  adaptLegacyPreset(fadeInDown),
  adaptLegacyPreset(fadeInLeft),
  adaptLegacyPreset(fadeInRight),
  adaptLegacyPreset(fadeInUp),
  adaptLegacyPreset(slideInDown),
  adaptLegacyPreset(slideInUp)
];

export default entrancePresets;
