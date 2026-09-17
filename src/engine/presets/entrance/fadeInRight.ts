import { PresetDefinition } from '../types';
import { easeOutCubic } from '../../utils/easing';

export const fadeInRight: PresetDefinition = {
  id: 'entrance_fade_in_right',
  name: '从右侧淡入 (Fade In Right)',
  category: 'entrance',
  schema: [
    { key: 'distance', label: '滑入距离', type: 'number', default: 60, min: 10, max: 300, step: 10 },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = params.distance || 60;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeOutCubic(t);
    return {
      transform: { ...currentTransform, x: currentTransform.x + distance * (1 - eased) },
      opacity: eased,
    };
  }
};
