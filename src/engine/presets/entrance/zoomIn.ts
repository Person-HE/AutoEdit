import { PresetDefinition } from '../types';
import { easeOutBack } from '../../utils/easing';

export const zoomIn: PresetDefinition = {
  id: 'entrance_zoom_in',
  name: '缩放进入 (Zoom In)',
  category: 'entrance',
  schema: [
    { key: 'startScale', label: '起始缩放', type: 'number', default: 0.3, min: 0.05, max: 0.8, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const startScale = params.startScale || 0.3;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeOutBack(t);
    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (startScale + (1 - startScale) * eased)),
      },
      opacity: easeOutBack(t),
    };
  }
};
