import { PresetDefinition } from '../types';
import { gravityBounce, easeInExpo, dampedOscillation } from '../../utils/easing';

export const fadeOutDown: PresetDefinition = {
  id: 'exit_fade_out_down',
  name: '向下淡出 (Fade Out Down)',
  category: 'exit',
  schema: [
    {
      key: 'distance',
      label: '下移距离',
      type: 'number',
      default: 50,
      min: 10,
      max: 200,
      step: 10
    }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const distance = Math.max(10, Math.min(200, params.distance || 50));
    const moveEased = gravityBounce(t, 0.3, 15);
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 2.5, 0.35) * 2 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + distance * moveEased,
        rotation: currentTransform.rotation + wobble
      },
      opacity: Math.max(0.01, 1 - opacityEased)
    };
  }
};
