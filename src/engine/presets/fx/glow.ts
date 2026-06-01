import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const glow: PresetDefinition = {
  id: 'fx_glow',
  name: '发光效果 (Glow)',
  category: 'fx',
  schema: [
    { key: 'color', label: '颜色', type: 'color', default: '#00ffff' },
    { key: 'intensity', label: '强度', type: 'number', default: 20, min: 0, max: 100, step: 5 },
    { key: 'pulse', label: '脉冲', type: 'boolean', default: true }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(100, params.intensity || 20));
    const color = params.color || '#00ffff';
    const pulse = params.pulse !== false;
    const p = Math.max(0, Math.min(1, progress));

    const pulseFactor = pulse
      ? 1 + dampedOscillation(p, 4, 0.05) * 0.3
      : 1;

    const glowIntensity = intensity * pulseFactor;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(0 0 ${glowIntensity}px ${color}) drop-shadow(0 0 ${glowIntensity * 0.5}px ${color})`
    };
  }
};
