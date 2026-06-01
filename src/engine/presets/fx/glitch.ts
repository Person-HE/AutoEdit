import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const glitch: PresetDefinition = {
  id: 'fx_glitch',
  name: '故障效果 (Glitch)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 10, min: 0, max: 50, step: 1 },
    { key: 'rgbShift', label: 'RGB分离', type: 'number', default: 3, min: 0, max: 10, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(50, params.intensity || 10));
    const rgbShift = Math.max(0, Math.min(10, params.rgbShift || 3));
    const p = Math.max(0, Math.min(1, progress));

    const glitchNoise1 = perlinNoise1D(p, 15, 0) * 2 - 1;
    const glitchNoise2 = perlinNoise1D(p, 20, 33) * 2 - 1;
    const glitchOffset = glitchNoise1 * intensity;
    const scaleX = 1 + glitchNoise2 * 0.03;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + glitchOffset,
        scale: Math.max(0.001, currentTransform.scale * scaleX)
      },
      opacity: 1,
      filter: `drop-shadow(${rgbShift}px 0 0 rgba(255, 0, 0, 0.5)) drop-shadow(-${rgbShift}px 0 0 rgba(0, 255, 255, 0.5))`
    };
  }
};
