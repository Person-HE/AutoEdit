import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const neon: PresetDefinition = {
  id: 'fx_neon',
  name: '霓虹效果 (Neon)',
  category: 'fx',
  schema: [
    { key: 'color', label: '颜色', type: 'color', default: '#ff00ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 25, min: 0, max: 100, step: 5 },
    { key: 'spread', label: '扩散', type: 'number', default: 15, min: 0, max: 50, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#ff00ff';
    const intensity = Math.max(0, Math.min(100, params.intensity || 25));
    const spread = Math.max(0, Math.min(50, params.spread || 15));
    const p = Math.max(0, Math.min(1, progress));

    const flickerNoise = perlinNoise1D(p, 12, 0) * 0.3 + perlinNoise1D(p, 25, 99) * 0.15;
    const flickerFactor = 0.7 + flickerNoise;
    const glowIntensity = intensity * flickerFactor;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `brightness(1.2) drop-shadow(0 0 ${spread * flickerFactor}px ${color}) drop-shadow(0 0 ${spread * 2 * flickerFactor}px ${color}) drop-shadow(0 0 ${spread * 4 * flickerFactor}px ${color})`,
      color: color
    };
  }
};
