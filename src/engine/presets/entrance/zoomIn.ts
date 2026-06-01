import { PresetDefinition } from '../types';
import { spring, easeOutExpo } from '../../utils/easing';

export const zoomIn: PresetDefinition = {
  id: 'entrance_zoom_in',
  name: '缩放进入 (Zoom In)',
  category: 'entrance',
  schema: [
    { key: 'startScale', label: '起始缩放', type: 'number', default: 0.5, min: 0.1, max: 1, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const startScale = Math.max(0.1, Math.min(1, params.startScale || 0.5));
    const t = Math.max(0, Math.min(1, progress));
    const scaleEased = spring(t, 160, 10, 1);
    const opacityEased = easeOutExpo(t);
    const scale = startScale + (1 - startScale) * scaleEased;
    const overshoot = t < 1 ? Math.sin(t * Math.PI * 2) * 0.03 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + overshoot))
      },
      opacity: Math.max(0.01, opacityEased)
    };
  }
};
