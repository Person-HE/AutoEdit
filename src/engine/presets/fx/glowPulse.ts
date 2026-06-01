import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const glowPulse: PresetDefinition = {
  id: 'fx_glowPulse',
  name: '脉冲发光 (Glow Pulse)',
  category: 'fx',
  schema: [
    { key: 'color', label: '颜色', type: 'color', default: '#00ffff' },
    { key: 'intensity', label: '强度', type: 'number', default: 20, min: 0, max: 100, step: 5 },
    { key: 'speed', label: '脉冲速度', type: 'number', default: 2, min: 0.5, max: 10, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(100, params.intensity || 20));
    const color = params.color || '#00ffff';
    const speed = Math.max(0.5, Math.min(10, params.speed || 2));
    const p = Math.max(0, Math.min(1, progress));

    const oscillation = dampedOscillation(p, speed * 2, 0.02);
    const pulseFactor = oscillation * 0.5 + 0.5;

    const glowIntensity = intensity * pulseFactor;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(0 0 ${glowIntensity}px ${color}) drop-shadow(0 0 ${glowIntensity * 0.5}px ${color})`
    };
  }
};
