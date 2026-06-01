import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const cubeRotate: PresetDefinition = {
  id: 'transition_cube_rotate',
  name: '立方体旋转 (Cube Rotate)',
  category: 'transition',
  schema: [],
  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const settle = 1 + dampedOscillation(p, 2, 0.15) * 0.08;
    const eased = p * settle;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + 90 * (1 - eased)
      },
      opacity: Math.max(0.01, eased)
    };
  }
};
