import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const shake: PresetDefinition = {
  id: 'emphasis_shake',
  name: '抖动 (Shake)',
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

    const shakeX = dampedOscillation(p, frequency, dampingRatio) * intensity;
    const shakeY = dampedOscillation(p, frequency * 1.3, dampingRatio + 0.05) * intensity * 0.6;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + shakeX,
        y: currentTransform.y + shakeY
      },
      opacity: 1
    };
  }
};
