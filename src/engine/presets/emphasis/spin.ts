import { PresetDefinition } from '../types';
import { momentumEase } from '../../utils/easing';

export const spin: PresetDefinition = {
  id: 'emphasis_spin',
  name: '旋转 (Spin)',
  category: 'emphasis',
  schema: [
    { key: 'rotations', label: '旋转圈数', type: 'number', default: 1, min: 0.5, max: 5, step: 0.5 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const rotations = Math.max(0.5, Math.min(5, params.rotations || 1));
    const speed = Math.max(0.5, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const mass = 1;
    const friction = 0.3 / speed;
    const momentum = momentumEase(p, mass, friction);
    const rotation = momentum * 360 * rotations;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotation
      },
      opacity: 1
    };
  }
};
