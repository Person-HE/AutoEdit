import { AnimationEffect, EffectRenderMode } from '../../PresetTypes';
import type { PresetDefinition } from '../../../../engine/presets/types';
import {
  floatY,
  parallaxFloat,
  orbit,
  bounce,
  drift,
  sway
} from '../../../../engine/presets/motion';

function adaptLegacyPreset(legacyPreset: PresetDefinition, renderMode: EffectRenderMode = EffectRenderMode.CANVAS_2D): AnimationEffect {
  return {
    ...legacyPreset,
    renderMode,
    gpuSafeProps: legacyPreset.schema.map(param => param.key)
  };
}

export {
  floatY,
  parallaxFloat,
  orbit,
  bounce,
  drift,
  sway
};

export const motionPresets: AnimationEffect[] = [
  adaptLegacyPreset(floatY),
  adaptLegacyPreset(parallaxFloat),
  adaptLegacyPreset(orbit),
  adaptLegacyPreset(bounce),
  adaptLegacyPreset(drift),
  adaptLegacyPreset(sway)
];

export default motionPresets;
