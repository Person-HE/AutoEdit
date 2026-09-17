import { PresetDefinition } from '../types';
import { spring, dampedOscillation } from '../../utils/easing';

export const shockwaveRing: PresetDefinition = {
  id: 'emphasis_shockwave_ring',
  name: '冲击波环 (Shockwave Ring)',
  category: 'emphasis',
  schema: [
    { key: 'color', label: '颜色', type: 'color', default: '#00f0ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#00f0ff';
    const intensity = Math.max(0.2, Math.min(3, params.intensity || 1));
    const t = Math.max(0, Math.min(1, progress));

    const shock = spring(t, 150, 8, 1);
    const wave = dampedOscillation(t, 2, 0.25) * 0.08 * intensity;
    const scalePulse = 1 + shock * 0.15 * intensity + wave;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scalePulse)
      },
      opacity: 1,
      filter: `drop-shadow(0 0 ${10 * shock * intensity}px ${color}) drop-shadow(0 0 ${30 * shock * intensity}px ${color})`
    };
  }
};
