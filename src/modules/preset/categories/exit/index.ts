import { AnimationEffect, EffectRenderMode } from '../../PresetTypes';
import type { PresetDefinition } from '../../../../engine/presets/types';

function adaptLegacyPreset(legacyPreset: PresetDefinition, renderMode: EffectRenderMode = EffectRenderMode.CANVAS_2D): AnimationEffect {
  return {
    ...legacyPreset,
    renderMode,
    gpuSafeProps: legacyPreset.schema.map(param => param.key)
  };
}

export {
  fadeOut,
  fadeOutUp,
  fadeOutDown,
  zoomOut,
  slideOutDown,
  slideOutUp,
  slideOutLeft,
  slideOutRight,
  bounceOut,
  glitchOut
} from '../../../../engine/presets/exit';

import {
  fadeOut,
  fadeOutUp,
  fadeOutDown,
  zoomOut,
  slideOutDown,
  slideOutUp,
  slideOutLeft,
  slideOutRight,
  bounceOut,
  glitchOut
} from '../../../../engine/presets/exit';

export const exitPresets: AnimationEffect[] = [
  adaptLegacyPreset(fadeOut),
  adaptLegacyPreset(fadeOutUp),
  adaptLegacyPreset(fadeOutDown),
  adaptLegacyPreset(zoomOut),
  adaptLegacyPreset(slideOutDown),
  adaptLegacyPreset(slideOutUp),
  adaptLegacyPreset(slideOutLeft),
  adaptLegacyPreset(slideOutRight),
  adaptLegacyPreset(bounceOut),
  adaptLegacyPreset(glitchOut)
];

export default exitPresets;
