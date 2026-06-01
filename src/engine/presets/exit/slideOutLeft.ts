import { PresetDefinition } from '../types';
import { momentumEase, easeInExpo, dampedOscillation } from '../../utils/easing';

export const slideOutLeft: PresetDefinition = {
  id: 'exit_slide_out_left',
  name: '左滑出 (Slide Out Left)',
  category: 'exit',
  schema: [
    {
      key: 'distance',
      label: '滑出距离',
      type: 'number',
      default: 200,
      min: 50,
      max: 500,
      step: 50
    }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const distance = Math.max(50, Math.min(500, params.distance || 200));
    const moveEased = momentumEase(t, 1, 0.3);
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 3, 0.4) * 1.5 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x - distance * moveEased,
        rotation: currentTransform.rotation + wobble
      },
      opacity: Math.max(0.01, 1 - opacityEased)
    };
  }
};
