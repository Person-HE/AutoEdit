import { PresetDefinition } from '../types';
import { easeOutQuart } from '../../utils/easing';

export const slideInRight: PresetDefinition = {
  id: 'entrance_slide_in_right',
  name: '从右方滑入 (Slide In Right)',
  category: 'entrance',
  schema: [
    { key: 'distance', label: '滑入距离', type: 'number', default: 100, min: 20, max: 500, step: 10 },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = params.distance || 100;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeOutQuart(t);
    return {
      transform: { ...currentTransform, x: currentTransform.x + distance * (1 - eased) },
      opacity: 1,
    };
  }
};
