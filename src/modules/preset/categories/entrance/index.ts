import { AnimationEffect, EffectRenderMode } from '../../PresetTypes';
import type { PresetDefinition } from '../../../../engine/presets/types';
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  zoomIn,
  rotateIn,
  flipInX,
  flipInY,
  slideInLeft,
  slideInRight,
  slideInUp,
  slideInDown,
  smashIn,
  glitchIn,
  glitchSmash,
  bounceIn,
  elasticBounce,
  springScale
} from '../../../../engine/presets/entrance';

function adaptLegacyPreset(legacyPreset: PresetDefinition, renderMode: EffectRenderMode = EffectRenderMode.CANVAS_2D): AnimationEffect {
  return {
    ...legacyPreset,
    renderMode,
    gpuSafeProps: legacyPreset.schema.map(param => param.key)
  };
}

export {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  zoomIn,
  rotateIn,
  flipInX,
  flipInY,
  slideInLeft,
  slideInRight,
  slideInUp,
  slideInDown,
  smashIn,
  glitchIn,
  glitchSmash,
  bounceIn,
  elasticBounce,
  springScale
};

export const entrancePresets: AnimationEffect[] = [
  adaptLegacyPreset(fadeIn),
  adaptLegacyPreset(fadeInUp),
  adaptLegacyPreset(fadeInDown),
  adaptLegacyPreset(fadeInLeft),
  adaptLegacyPreset(fadeInRight),
  adaptLegacyPreset(zoomIn),
  adaptLegacyPreset(rotateIn),
  adaptLegacyPreset(flipInX),
  adaptLegacyPreset(flipInY),
  adaptLegacyPreset(slideInLeft),
  adaptLegacyPreset(slideInRight),
  adaptLegacyPreset(slideInUp),
  adaptLegacyPreset(slideInDown),
  adaptLegacyPreset(smashIn),
  adaptLegacyPreset(glitchIn),
  adaptLegacyPreset(glitchSmash),
  adaptLegacyPreset(bounceIn),
  adaptLegacyPreset(elasticBounce),
  adaptLegacyPreset(springScale)
];

export default entrancePresets;
