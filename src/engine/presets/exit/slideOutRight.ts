import { PresetDefinition } from '../types';
import { momentumEase, easeInExpo, dampedOscillation } from '../../utils/easing';

export const slideOutRight: PresetDefinition = {
  id: 'exit_slide_out_right',
  name: '右侧滑出 (Slide Out Right)',
  category: 'exit',
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 500, min: 100, max: 2000 }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const distance = Math.max(100, Math.min(2000, params.distance || 500));
    const moveEased = momentumEase(t, 1, 0.3);
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 3, 0.4) * 1.5 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + distance * moveEased,
        rotation: currentTransform.rotation - wobble
      },
      opacity: Math.max(0.01, 1 - opacityEased)
    };
  }
};
