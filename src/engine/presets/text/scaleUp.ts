import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const scaleUp: PresetDefinition = {
  id: 'text_scale_up',
  name: '文字放大 (Scale Text)',
  category: 'text',
  schema: [],
  apply: (progress, params, currentTransform) => {
    const p = Math.max(0, Math.min(1, progress));
    const eased = spring(p, 180, 14, 1);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * eased)
      },
      opacity: Math.max(0.01, p)
    };
  }
};
