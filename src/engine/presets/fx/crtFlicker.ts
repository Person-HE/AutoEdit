import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const crtFlicker: PresetDefinition = {
  id: 'fx_crt_flicker',
  name: 'CRT闪烁 (CRT Flicker)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '闪烁强度', type: 'number', default: 0.15, min: 0, max: 0.5, step: 0.05 },
    { key: 'scanlineOpacity', label: '扫描线透明度', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(0.5, params.intensity || 0.15));
    const scanlineOpacity = Math.max(0, Math.min(1, params.scanlineOpacity || 0.3));
    const t = Math.max(0, Math.min(1, progress));

    const flicker = perlinNoise1D(t, 20, 0) * intensity + 1;
    const scanline = dampedOscillation(t * 4, 2, 0.1) * scanlineOpacity;
    const rgbShift = perlinNoise1D(t, 12, 5) * 2 * intensity;

    return {
      transform: currentTransform,
      opacity: Math.max(0.5, flicker),
      filter: `brightness(${flicker}) contrast(1.1) drop-shadow(${rgbShift}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-${rgbShift}px 0 0 rgba(0,255,255,0.5))`
    };
  }
};
