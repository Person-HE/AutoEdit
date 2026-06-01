import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const shakeY: PresetDefinition = {
  id: 'emphasis_shakeY',
  name: 'Y轴抖动 (Shake Y)',
  category: 'emphasis',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 10, min: 1, max: 50, step: 1 },
    { key: 'speed', label: '速度', type: 'number', default: 10, min: 1, max: 30, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(1, Math.min(50, params.intensity || 10));
    const speed = Math.max(1, Math.min(30, params.speed || 10));
    const p = Math.max(0, Math.min(1, progress));

    const frequency = speed * 0.5 + 3;
    const dampingRatio = 0.35;

    const shakeY = dampedOscillation(p, frequency, dampingRatio) * intensity;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + shakeY
      },
      opacity: 1
    };
  }
};
