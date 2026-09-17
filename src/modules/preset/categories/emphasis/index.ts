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
  flash,
  jitter,
  wobble,
  pulse,
  pulseGlow,
  shockwave,
  focusZoom,
  shake
} from '../../../../engine/presets/emphasis';

import {
  flash,
  jitter,
  wobble,
  pulse,
  pulseGlow,
  shockwave,
  focusZoom,
  shake
} from '../../../../engine/presets/emphasis';

export const emphasisPresets: AnimationEffect[] = [
  adaptLegacyPreset(flash),
  adaptLegacyPreset(jitter),
  adaptLegacyPreset(wobble),
  adaptLegacyPreset(pulse),
  adaptLegacyPreset(pulseGlow),
  adaptLegacyPreset(shockwave),
  adaptLegacyPreset(focusZoom),
  adaptLegacyPreset(shake)
];

export default emphasisPresets;
