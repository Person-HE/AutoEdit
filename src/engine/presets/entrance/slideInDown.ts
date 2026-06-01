import { PresetDefinition } from '../types';
import { momentumEase, spring, easeOutExpo } from '../../utils/easing';

export const slideInDown: PresetDefinition = {
  id: 'entrance_slide_in_down',
  name: '向下滑入 (Slide In Down)',
  category: 'entrance',
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 500, min: 100, max: 2000 },
    { key: 'fadeIn', label: '淡入', type: 'boolean', default: true }
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(2000, params.distance || 500));
    const fadeIn = params.fadeIn !== false;
    const t = Math.max(0, Math.min(1, progress));
    const posEased = momentumEase(t, 1.5, 0.4);
    const settleEased = spring(t, 100, 12, 1);
    const currentY = -distance * (1 - posEased);
    const settleY = t < 1 ? (settleEased - posEased) * distance * 0.05 : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x,
        y: currentTransform.y + currentY - settleY
      },
      opacity: fadeIn ? Math.max(0.01, easeOutExpo(t)) : 1
    };
  }
};
