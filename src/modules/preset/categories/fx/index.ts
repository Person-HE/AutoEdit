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
  grayscale,
  blur,
  glow,
  brightness,
  hueRotate,
  saturate,
  contrast,
  glassmorphism,
  glitch,
  glitchCyber,
  neon,
  neonPulse,
  scanline,
  glowPulse,
  glowRainbow,
  blurIn,
  blurOut,
  shadow,
  shadowLift
} from '../../../../engine/presets/fx';

import {
  grayscale,
  blur,
  glow,
  brightness,
  hueRotate,
  saturate,
  contrast,
  glassmorphism,
  glitch,
  glitchCyber,
  neon,
  neonPulse,
  scanline,
  glowPulse,
  glowRainbow,
  blurIn,
  blurOut,
  shadow,
  shadowLift
} from '../../../../engine/presets/fx';

export const fxPresets: AnimationEffect[] = [
  adaptLegacyPreset(grayscale),
  adaptLegacyPreset(blur),
  adaptLegacyPreset(glow),
  adaptLegacyPreset(brightness),
  adaptLegacyPreset(hueRotate),
  adaptLegacyPreset(saturate),
  adaptLegacyPreset(contrast),
  adaptLegacyPreset(glassmorphism),
  adaptLegacyPreset(glitch),
  adaptLegacyPreset(glitchCyber),
  adaptLegacyPreset(neon),
  adaptLegacyPreset(neonPulse),
  adaptLegacyPreset(scanline),
  adaptLegacyPreset(glowPulse),
  adaptLegacyPreset(glowRainbow),
  adaptLegacyPreset(blurIn),
  adaptLegacyPreset(blurOut),
  adaptLegacyPreset(shadow),
  adaptLegacyPreset(shadowLift)
];

export default fxPresets;
