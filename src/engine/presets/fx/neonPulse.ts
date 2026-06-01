import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const neonPulse: PresetDefinition = {
  id: 'fx_neonPulse',
  name: '霓虹脉冲 (Neon Pulse)',
  category: 'fx',
  schema: [
    { key: 'color', label: '颜色', type: 'color', default: '#00ffff' },
    { key: 'intensity', label: '强度', type: 'number', default: 30, min: 0, max: 100, step: 5 },
    { key: 'speed', label: '脉冲速度', type: 'number', default: 4, min: 1, max: 10, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#00ffff';
    const intensity = Math.max(0, Math.min(100, params.intensity || 30));
    const speed = Math.max(1, Math.min(10, params.speed || 4));
    const p = Math.max(0, Math.min(1, progress));

    const oscillation = dampedOscillation(p, speed * 1.5, 0.02);
    const flickerNoise = perlinNoise1D(p, 20, 55) * 0.1;
    const pulseFactor = oscillation + flickerNoise;
    const glowIntensity = intensity * (0.5 + 0.5 * pulseFactor);

    return {
      transform: currentTransform,
      opacity: 0.8 + 0.2 * pulseFactor,
      filter: `brightness(${1 + pulseFactor * 0.3}) drop-shadow(0 0 ${glowIntensity * 0.5}px ${color}) drop-shadow(0 0 ${glowIntensity}px ${color}) drop-shadow(0 0 ${glowIntensity * 2}px ${color})`
    };
  }
};
