import { PresetDefinition } from '../types';
import { easeOutCubic } from '../../utils/easing';

export const flipInY: PresetDefinition = {
  id: 'entrance_flip_in_y',
  name: 'Y轴翻转进入 (Flip In Y)',
  category: 'entrance',
  schema: [
    { key: 'startAngle', label: '起始角度', type: 'number', default: 90, min: 45, max: 180, step: 15 },
    { key: 'perspective', label: '透视距离', type: 'number', default: 800, min: 200, max: 2000, step: 100 },
  ],
  apply: (progress, params, currentTransform) => {
    const startAngle = params.startAngle || 90;
    const perspective = params.perspective || 800;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeOutCubic(t);
    const angle = startAngle * (1 - eased);
    return {
      transform: { ...currentTransform, rotateY: angle, perspective },
      opacity: eased,
    };
  }
};
