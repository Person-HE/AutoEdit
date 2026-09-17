import { PresetDefinition } from '../types';
import { spring, perlinNoise1D, easeOutExpo } from '../../utils/easing';

export const glitchSmash: PresetDefinition = {
  id: 'entrance_glitch_smash',
  name: '故障砸入 (Glitch Smash)',
  category: 'entrance',
  schema: [
    { key: 'intensity', label: '故障强度', type: 'number', default: 20, min: 5, max: 60, step: 5 },
    { key: 'rgbShift', label: 'RGB分离', type: 'number', default: 5, min: 0, max: 15, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(5, Math.min(60, params.intensity || 20));
    const rgbShift = Math.max(0, Math.min(15, params.rgbShift || 5));
    const t = Math.max(0, Math.min(1, progress));

    const smash = spring(t, 200, 10, 1);
    const noise = perlinNoise1D(t, 18, 0) * 2 - 1;
    const glitchOffset = t < 0.6 ? noise * intensity * (1 - t / 0.6) : 0;
    const scaleJitter = 1 + (perlinNoise1D(t, 24, 7) * 2 - 1) * 0.05 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + (1 - smash) * -300,
        x: currentTransform.x + glitchOffset,
        scale: Math.max(0.001, currentTransform.scale * (0.7 + 0.3 * smash) * scaleJitter)
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: t < 0.5
        ? `drop-shadow(${rgbShift}px 0 0 rgba(255,0,0,0.7)) drop-shadow(-${rgbShift}px 0 0 rgba(0,255,255,0.7))`
        : undefined
    };
  }
};
