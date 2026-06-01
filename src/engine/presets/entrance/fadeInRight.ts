import { PresetDefinition } from '../types';
import { spring, momentumEase, easeOutExpo } from '../../utils/easing';

export const fadeInRight: PresetDefinition = {
  id: 'entrance_fade_in_right',
  name: '向右淡入 (Fade In Right)',
  category: 'entrance',
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 100, min: 50, max: 500 },
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.9, min: 0.1, max: 1.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(50, Math.min(500, params.distance || 100));
    const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.9));
    const t = Math.max(0, Math.min(1, progress));
    const posEased = momentumEase(t, 1.2, 0.35);
    const scaleEased = spring(t, 140, 13, 1);
    const opacityEased = easeOutExpo(t);
    const currentX = -distance * (1 - posEased);
    const scale = scaleFrom + (1 - scaleFrom) * scaleEased;
    const overshootX = t < 1 ? Math.sin(t * Math.PI * 2.5) * 5 * (1 - t) * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + currentX + overshootX,
        y: currentTransform.y,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: Math.max(0.01, opacityEased)
    };
  }
};
