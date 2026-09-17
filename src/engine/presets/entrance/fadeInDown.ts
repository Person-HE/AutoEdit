import { PresetDefinition } from '../types';
import { easeOutCubic } from '../../utils/easing';

export const fadeInDown: PresetDefinition = {
  id: 'entrance_fade_in_down',
  name: '从上方淡入 (Fade In Down)',
  category: 'entrance',
  schema: [
    { key: 'distance', label: '下落距离', type: 'number', default: 60, min: 10, max: 300, step: 10 },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = params.distance || 60;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeOutCubic(t);
    return {
      transform: { ...currentTransform, y: currentTransform.y - distance * (1 - eased) },
      opacity: eased,
    };
  }
};
