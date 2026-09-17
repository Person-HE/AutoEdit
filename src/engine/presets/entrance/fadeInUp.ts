import { PresetDefinition } from '../types';
import { easeOutCubic } from '../../utils/easing';

export const fadeInUp: PresetDefinition = {
  id: 'entrance_fade_in_up',
  name: '从下方淡入 (Fade In Up)',
  category: 'entrance',
  schema: [
    { key: 'distance', label: '上升距离', type: 'number', default: 60, min: 10, max: 300, step: 10 },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = params.distance || 60;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeOutCubic(t);
    return {
      transform: { ...currentTransform, y: currentTransform.y + distance * (1 - eased) },
      opacity: eased,
    };
  }
};
