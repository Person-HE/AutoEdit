import { PresetDefinition } from '../types';
import { easeOutCubic } from '../../utils/easing';

export const rotateIn: PresetDefinition = {
  id: 'entrance_rotate_in',
  name: '旋转进入 (Rotate In)',
  category: 'entrance',
  schema: [
    { key: 'startAngle', label: '起始角度', type: 'number', default: -180, min: -360, max: 0, step: 15 },
    { key: 'startScale', label: '起始缩放', type: 'number', default: 0.3, min: 0.1, max: 0.8, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const startAngle = params.startAngle ?? -180;
    const startScale = params.startScale || 0.3;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeOutCubic(t);
    return {
      transform: {
        ...currentTransform,
        rotation: startAngle * (1 - eased),
        scale: Math.max(0.001, currentTransform.scale * (startScale + (1 - startScale) * eased)),
      },
      opacity: eased,
    };
  }
};
