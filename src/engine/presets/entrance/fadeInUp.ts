import { PresetDefinition } from '../types';
import { spring, gravityBounce, easeOutExpo } from '../../utils/easing';

export const fadeInUp: PresetDefinition = {
  id: 'entrance_fade_in_up',
  name: '向上淡入 (Fade In Up)',
  category: 'entrance',
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 100, min: 50, max: 500 },
    { key: 'scaleFrom', label: '起始缩放', type: 'number', default: 0.9, min: 0.1, max: 1.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(50, Math.min(500, params.distance || 100));
    const scaleFrom = Math.max(0.1, Math.min(1.5, params.scaleFrom || 0.9));
    const t = Math.max(0, Math.min(1, progress));
    const posEased = gravityBounce(t, 0.55, 9.8);
    const scaleEased = spring(t, 140, 13, 1);
    const opacityEased = easeOutExpo(t);
    const currentY = distance * (1 - posEased);
    const scale = scaleFrom + (1 - scaleFrom) * scaleEased;
    const settleY = t < 1 ? Math.sin(t * Math.PI * 3) * 3 * (1 - t) * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x,
        y: currentTransform.y + currentY + settleY,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: Math.max(0.01, opacityEased)
    };
  }
};
