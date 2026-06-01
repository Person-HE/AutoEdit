import { PresetDefinition } from '../types';
import { momentumEase, easeInExpo, dampedOscillation } from '../../utils/easing';

export const fadeOutUp: PresetDefinition = {
  id: 'exit_fade_out_up',
  name: '向上淡出 (Fade Out Up)',
  category: 'exit',
  schema: [
    {
      key: 'distance',
      label: '上移距离',
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
    const moveEased = momentumEase(t, 1, 0.3);
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 3, 0.4) * 1.5 * (1 - t);

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
