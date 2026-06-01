import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const fadeIn: PresetDefinition = {
  id: 'entrance_fade_in',
  name: '淡入 (Fade In)',
  category: 'entrance',
  schema: [
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.8, min: 0.1, max: 1.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.8));
    const t = Math.max(0, Math.min(1, progress));
    const scaleEased = spring(t, 120, 14, 1);
    const opacityEased = easeOutExpo(t);
    const scale = scaleFrom + (1 - scaleFrom) * scaleEased;
    const settleWobble = t < 1 ? dampedOscillation(t, 4, 0.25) * 0.02 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + settleWobble))
      },
      opacity: Math.max(0.01, opacityEased)
    };
  }
};
