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
  zoomOut,
  zoomOutUp,
  slideOutRight,
  slideOutLeft,
  slideOutUp,
  slideOutDown,
  fadeOut,
  fadeOutUp,
  fadeOutDown,
  bounceOut
} from '../../../../engine/presets/exit';

import {
  zoomOut,
  zoomOutUp,
  slideOutRight,
  slideOutLeft,
  slideOutUp,
  slideOutDown,
  fadeOut,
  fadeOutUp,
  fadeOutDown,
  bounceOut
} from '../../../../engine/presets/exit';

export const exitPresets: AnimationEffect[] = [
  adaptLegacyPreset(zoomOut),
  adaptLegacyPreset(zoomOutUp),
  adaptLegacyPreset(slideOutRight),
  adaptLegacyPreset(slideOutLeft),
  adaptLegacyPreset(slideOutUp),
  adaptLegacyPreset(slideOutDown),
  adaptLegacyPreset(fadeOut),
  adaptLegacyPreset(fadeOutUp),
  adaptLegacyPreset(fadeOutDown),
  adaptLegacyPreset(bounceOut)
];

export default exitPresets;
