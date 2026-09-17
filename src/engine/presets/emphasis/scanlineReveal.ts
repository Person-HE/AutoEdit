import { PresetDefinition } from '../types';
import { easeInOutCubic, perlinNoise1D } from '../../utils/easing';

export const scanlineReveal: PresetDefinition = {
  id: 'emphasis_scanline_reveal',
  name: '扫描线揭示 (Scanline Reveal)',
  category: 'emphasis',
  schema: [
    { key: 'color', label: '扫描线颜色', type: 'color', default: '#00ff9d' },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5 },
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#00ff9d';
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const t = Math.max(0, Math.min(1, progress));

    const scanPos = easeInOutCubic((t * speed) % 1);
    const glow = perlinNoise1D(t, speed * 4, 0) * 0.3 + 0.7;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `brightness(${1 + scanPos * 0.3}) drop-shadow(0 ${scanPos * 10 - 5}px ${20 * glow}px ${color})`
    };
  }
};
