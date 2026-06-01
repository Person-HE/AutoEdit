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
  wipeRight,
  wipeLeft,
  crossDissolve,
  pageFlip,
  cubeRotate
} from '../../../../engine/presets/transition';

import {
  wipeRight,
  wipeLeft,
  crossDissolve,
  pageFlip,
  cubeRotate
} from '../../../../engine/presets/transition';

export const transitionPresets: AnimationEffect[] = [
  adaptLegacyPreset(wipeRight),
  adaptLegacyPreset(wipeLeft),
  adaptLegacyPreset(crossDissolve),
  adaptLegacyPreset(pageFlip),
  adaptLegacyPreset(cubeRotate)
];

export default transitionPresets;
