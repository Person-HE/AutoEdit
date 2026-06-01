import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const glowRainbow: PresetDefinition = {
  id: 'fx_glowRainbow',
  name: '彩虹发光 (Glow Rainbow)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 20, min: 0, max: 100, step: 5 },
    { key: 'cycleCount', label: '彩虹循环次数', type: 'number', default: 2, min: 1, max: 10, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(100, params.intensity || 20));
    const cycleCount = Math.max(1, Math.min(10, params.cycleCount || 2));
    const p = Math.max(0, Math.min(1, progress));

    const hue = Math.floor(p * 360 * cycleCount) % 360;
    const color = `hsl(${hue}, 100%, 50%)`;

    const pulseFactor = 1 + dampedOscillation(p, cycleCount * 2, 0.03) * 0.15;
    const glowIntensity = intensity * pulseFactor;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(0 0 ${glowIntensity}px ${color}) drop-shadow(0 0 ${glowIntensity * 0.5}px ${color})`
    };
  }
};
