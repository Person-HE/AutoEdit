import { PresetDefinition } from '../types';
import { easeInQuart } from '../../utils/easing';

export const slideOutDown: PresetDefinition = {
  id: 'exit_slide_out_down',
  name: '向下滑出 (Slide Out Down)',
  category: 'exit',
  schema: [
    { key: 'distance', label: '滑出距离', type: 'number', default: 100, min: 20, max: 500, step: 10 },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = params.distance || 100;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeInQuart(t);
    return {
      transform: { ...currentTransform, y: currentTransform.y + distance * eased },
      opacity: 1 - eased,
    };
  }
};
