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
  glow,
  neon,
  chromaticBurst,
  crtFlicker,
  scanline,
  glitchCyber,
  glowPulse,
  hueRotate
} from '../../../../engine/presets/fx';

import {
  glow,
  neon,
  chromaticBurst,
  crtFlicker,
  scanline,
  glitchCyber,
  glowPulse,
  hueRotate
} from '../../../../engine/presets/fx';

export const fxPresets: AnimationEffect[] = [
  adaptLegacyPreset(glow),
  adaptLegacyPreset(neon),
  adaptLegacyPreset(chromaticBurst),
  adaptLegacyPreset(crtFlicker),
  adaptLegacyPreset(scanline),
  adaptLegacyPreset(glitchCyber),
  adaptLegacyPreset(glowPulse),
  adaptLegacyPreset(hueRotate)
];

export default fxPresets;
