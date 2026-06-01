import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const wobble: PresetDefinition = {
  id: 'emphasis_wobble',
  name: '摇晃 (Wobble)',
  category: 'emphasis',
  schema: [
    { key: 'angle', label: '角度', type: 'number', default: 10, min: 5, max: 30, step: 1 },
    { key: 'speed', label: '速度', type: 'number', default: 3, min: 1, max: 6, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const angle = Math.max(5, Math.min(30, params.angle || 10));
    const speed = Math.max(1, Math.min(6, params.speed || 3));
    const p = Math.max(0, Math.min(1, progress));

    const frequency = speed * 0.8 + 1;
    const dampingRatio = 0.3;
    const rotationOscillation = dampedOscillation(p, frequency, dampingRatio);
    const wobbleAngle = rotationOscillation * angle;

    const scaleX = 1 + Math.abs(rotationOscillation) * 0.02;
    const scaleY = 1 - Math.abs(rotationOscillation) * 0.02;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + wobbleAngle,
        scale: Math.max(0.001, currentTransform.scale * (scaleX + scaleY) / 2)
      },
      opacity: 1
    };
  }
};
