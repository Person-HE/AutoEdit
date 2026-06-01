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
  typewriter,
  scaleUp
} from '../../../../engine/presets/text';

import {
  typewriter,
  scaleUp
} from '../../../../engine/presets/text';

export const textPresets: AnimationEffect[] = [
  adaptLegacyPreset(typewriter),
  adaptLegacyPreset(scaleUp)
];

export default textPresets;
