import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const wave: PresetDefinition = {
  id: 'motion_wave',
  name: '波浪 (Wave)',
  category: 'motion',
  schema: [
    { key: 'amplitude', label: '振幅', type: 'number', default: 30, min: 5, max: 100, step: 5 },
    { key: 'frequency', label: '频率', type: 'number', default: 3, min: 1, max: 10, step: 0.5 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const amplitude = Math.max(5, Math.min(100, params.amplitude || 30));
    const frequency = Math.max(1, Math.min(10, params.frequency || 3));
    const speed = Math.max(0.5, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const oscillation = dampedOscillation(p, frequency * speed, 0.08);
    const yOffset = oscillation * amplitude;
    const xOffset = p * 200;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + xOffset,
        y: currentTransform.y + yOffset
      },
      opacity: 1
    };
  }
};
