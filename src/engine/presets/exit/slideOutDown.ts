import { PresetDefinition } from '../types';
import { gravityBounce, easeInExpo, dampedOscillation } from '../../utils/easing';

export const slideOutDown: PresetDefinition = {
  id: 'exit_slide_out_down',
  name: '向下滑出 (Slide Out Down)',
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
    const moveEased = gravityBounce(t, 0.2, 15);
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 2.5, 0.35) * 1 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + distance * moveEased,
        rotation: currentTransform.rotation - wobble
      },
      opacity: Math.max(0.01, 1 - opacityEased)
    };
  }
};
