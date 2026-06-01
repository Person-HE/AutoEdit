import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const swing: PresetDefinition = {
  id: 'emphasis_swing',
  name: '摇摆 (Swing)',
  category: 'emphasis',
  schema: [
    { key: 'angle', label: '角度', type: 'number', default: 15, min: 5, max: 45, step: 5 },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const angle = Math.max(5, Math.min(45, params.angle || 15));
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const p = Math.max(0, Math.min(1, progress));

    const frequency = speed * 0.6 + 0.8;
    const dampingRatio = 0.2;
    const pendulumOscillation = dampedOscillation(p, frequency, dampingRatio);
    const rotation = pendulumOscillation * angle;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotation
      },
      opacity: 1
    };
  }
};
