import { PresetDefinition } from '../types';
import { momentumEase } from '../../utils/easing';

export const wipeLeft: PresetDefinition = {
  id: 'transition_wipe_left',
  name: '向左擦除 (Wipe Left)',
  category: 'transition',
  schema: [],
  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const eased = momentumEase(p, 1.5, 0.4);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + 1000 * (1 - eased)
      },
      opacity: Math.max(0.01, p)
    };
  }
};
