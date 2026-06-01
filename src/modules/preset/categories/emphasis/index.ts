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
  pulse,
  pulseRing,
  pulseGlow,
  shake,
  shakeX,
  shakeY,
  spin,
  focusZoom,
  swing,
  tutorialClick,
  bounce,
  bounceSoft,
  flash,
  flashSoft,
  heartbeat,
  jitter,
  breathe,
  wobble
} from '../../../../engine/presets/emphasis';

import {
  pulse,
  pulseRing,
  pulseGlow,
  shake,
  shakeX,
  shakeY,
  spin,
  focusZoom,
  swing,
  tutorialClick,
  bounce,
  bounceSoft,
  flash,
  flashSoft,
  heartbeat,
  jitter,
  breathe,
  wobble
} from '../../../../engine/presets/emphasis';

export const emphasisPresets: AnimationEffect[] = [
  adaptLegacyPreset(pulse),
  adaptLegacyPreset(pulseRing),
  adaptLegacyPreset(pulseGlow),
  adaptLegacyPreset(shake),
  adaptLegacyPreset(shakeX),
  adaptLegacyPreset(shakeY),
  adaptLegacyPreset(spin),
  adaptLegacyPreset(focusZoom),
  adaptLegacyPreset(swing),
  adaptLegacyPreset(tutorialClick),
  adaptLegacyPreset(bounce),
  adaptLegacyPreset(bounceSoft),
  adaptLegacyPreset(flash),
  adaptLegacyPreset(flashSoft),
  adaptLegacyPreset(heartbeat),
  adaptLegacyPreset(jitter),
  adaptLegacyPreset(breathe),
  adaptLegacyPreset(wobble)
];

export default emphasisPresets;
