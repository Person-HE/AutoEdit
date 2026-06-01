import { PresetDefinition } from '../types';
import { momentumEase, easeInExpo, dampedOscillation } from '../../utils/easing';

export const slideOutUp: PresetDefinition = {
  id: 'exit_slide_out_up',
  name: '向上滑出 (Slide Out Up)',
  category: 'exit',
  schema: [
    {
      key: 'distance',
      label: '滑出距离',
      type: 'number',
      default: 500,
      min: 100,
      max: 2000
    }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const distance = Math.max(100, Math.min(2000, params.distance || 500));
    const moveEased = momentumEase(t, 1.2, 0.25);
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 2.5, 0.35) * 1 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y - distance * moveEased,
        rotation: currentTransform.rotation + wobble
      },
      opacity: Math.max(0.01, 1 - opacityEased)
    };
  }
};
