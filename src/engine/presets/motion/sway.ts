import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const sway: PresetDefinition = {
  id: 'motion_sway',
  name: '摆动 (Sway)',
  category: 'motion',
  schema: [
    { key: 'angle', label: '摆动角度', type: 'number', default: 15, min: 5, max: 45, step: 5 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const angle = Math.max(5, Math.min(45, params.angle || 15));
    const speed = Math.max(0.5, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const pendulumDamping = 0.05;
    const pendulumFreq = speed * 1.5;
    const oscillation = dampedOscillation(p, pendulumFreq, pendulumDamping);
    const rotationOffset = oscillation * angle;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotationOffset
      },
      opacity: 1
    };
  }
};
