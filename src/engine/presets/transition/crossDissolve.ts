import { PresetDefinition } from '../types';
import { easeInOutExpo } from '../../utils/easing';

export const crossDissolve: PresetDefinition = {
  id: 'transition_cross_dissolve',
  name: '交叉溶解 (Cross Dissolve)',
  category: 'transition',
  schema: [],
  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const eased = easeInOutExpo(p);

    return {
      transform: currentTransform,
      opacity: Math.max(0.01, eased)
    };
  }
};
