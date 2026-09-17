import { PresetDefinition } from '../types';
import { spring, perlinNoise1D } from '../../utils/easing';

export const chromaticBurst: PresetDefinition = {
  id: 'fx_chromatic_burst',
  name: '色散爆发 (Chromatic Burst)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 8, min: 0, max: 30, step: 1 },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(30, params.intensity || 8));
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const t = Math.max(0, Math.min(1, progress));

    const burst = spring(t, 160, 14, 1);
    const noise = perlinNoise1D(t, speed * 8, 0) * 2 - 1;
    const shift = noise * intensity * (1 - burst * 0.5);
    const scalePulse = 1 + burst * 0.02;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scalePulse)
      },
      opacity: 1,
      filter: `drop-shadow(${shift}px 0 0 rgba(255,0,80,0.6)) drop-shadow(-${shift}px 0 0 rgba(0,255,220,0.6)) drop-shadow(0 ${shift * 0.5}px 0 rgba(180,0,255,0.4))`
    };
  }
};
