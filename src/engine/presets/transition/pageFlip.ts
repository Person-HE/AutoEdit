import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const pageFlip: PresetDefinition = {
  id: 'transition_page_flip',
  name: '翻页效果 (Page Flip)',
  category: 'transition',
  schema: [],
  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const eased = spring(p, 200, 18, 1);

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + 180 * (1 - eased)
      },
      opacity: Math.max(0.01, eased)
    };
  }
};
