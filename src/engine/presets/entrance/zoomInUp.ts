import { PresetDefinition } from '../types';
import { spring, gravityBounce, easeOutExpo } from '../../utils/easing';

export const zoomInUp: PresetDefinition = {
  id: 'entrance_zoom_in_up',
  name: '向上缩放进入 (Zoom In Up)',
  category: 'entrance',
  schema: [
    { key: 'startScale', label: '起始缩放', type: 'number', default: 0.5, min: 0.1, max: 1, step: 0.1 },
    { key: 'distance', label: '移动距离', type: 'number', default: 200, min: 50, max: 500, step: 50 }
  ],
  apply: (progress, params, currentTransform) => {
    const startScale = Math.max(0.1, Math.min(1, params.startScale || 0.5));
    const distance = Math.max(50, Math.min(500, params.distance || 200));
    const t = Math.max(0, Math.min(1, progress));
    const posEased = gravityBounce(t, 0.5, 10);
    const scaleEased = spring(t, 160, 10, 1);
    const opacityEased = easeOutExpo(t);
    const scale = startScale + (1 - startScale) * scaleEased;
    const yOffset = distance * (1 - posEased);
    const settleY = t < 1 ? Math.sin(t * Math.PI * 3) * 4 * (1 - t) * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
        y: currentTransform.y + yOffset + settleY
      },
      opacity: Math.max(0.01, opacityEased)
    };
  }
};
