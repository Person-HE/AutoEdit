import { PresetDefinition } from '../types';
import { easeInExpo, easeInQuint, dampedOscillation } from '../../utils/easing';

export const fadeOut: PresetDefinition = {
  id: 'exit_fade_out',
  name: '基础淡出 (Fade Out)',
  category: 'exit',
  schema: [],
  apply: (progress, _params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const opacityEased = easeInExpo(t);
    const scaleEased = easeInQuint(t);
    const wobble = dampedOscillation(t, 2, 0.5) * 0.5 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (1 - 0.08 * scaleEased)),
        rotation: currentTransform.rotation + wobble
      },
      opacity: Math.max(0.01, 1 - opacityEased)
    };
  }
};
