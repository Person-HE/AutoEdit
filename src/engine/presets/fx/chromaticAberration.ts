import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const chromaticAberration: PresetDefinition = {
  id: 'fx_chromatic_aberration',
  name: '色差冲击 (Chromatic Aberration)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '色差强度', type: 'number', default: 6, min: 0, max: 20, step: 0.5 },
    { key: 'speed', label: '闪烁速度', type: 'number', default: 3, min: 0.5, max: 8, step: 0.5 },
  ],
  apply: (progress, params) => {
    const intensity = Math.max(0, Math.min(20, params.intensity || 6));
    const speed = Math.max(0.5, Math.min(8, params.speed || 3));
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t * speed, 14, 7) * 0.5 + 0.5;
    const pulse = dampedOscillation(t, speed * 2, 0.2);
    const shift = intensity * (0.6 + 0.4 * noise + 0.3 * Math.abs(pulse));

    return {
      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
      opacity: 1,
      filter: `drop-shadow(${shift.toFixed(1)}px 0 0 rgba(255,0,80,0.6)) drop-shadow(-${shift.toFixed(1)}px 0 0 rgba(0,240,255,0.6))`,
    };
  },
};
