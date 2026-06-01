import { AnimationEffect, EffectRenderMode } from '../../PresetTypes';
import type { PresetDefinition } from '../../../../engine/presets/types';
import {
  float,
  floatX,
  floatY,
  orbit,
  orbitSlow,
  bounce,
  drift,
  driftSlow,
  sway,
  spiral,
  wave,
  tutorialFocus
} from '../../../../engine/presets/motion';

function adaptLegacyPreset(legacyPreset: PresetDefinition, renderMode: EffectRenderMode = EffectRenderMode.CANVAS_2D): AnimationEffect {
  return {
    ...legacyPreset,
    renderMode,
    gpuSafeProps: legacyPreset.schema.map(param => param.key)
  };
}

export {
  float,
  floatX,
  floatY,
  orbit,
  orbitSlow,
  bounce,
  drift,
  driftSlow,
  sway,
  spiral,
  wave,
  tutorialFocus
};

export const motionPresets: AnimationEffect[] = [
  adaptLegacyPreset(float),
  adaptLegacyPreset(floatX),
  adaptLegacyPreset(floatY),
  adaptLegacyPreset(orbit),
  adaptLegacyPreset(orbitSlow),
  adaptLegacyPreset(bounce),
  adaptLegacyPreset(drift),
  adaptLegacyPreset(driftSlow),
  adaptLegacyPreset(sway),
  adaptLegacyPreset(spiral),
  adaptLegacyPreset(wave),
  adaptLegacyPreset(tutorialFocus)
];

export default motionPresets;
