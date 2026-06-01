import { PresetDefinition } from '../types';
import { gravityBounce } from '../../utils/easing';

export const bounce: PresetDefinition = {
  id: 'emphasis_bounce',
  name: '弹跳 (Bounce)',
  category: 'emphasis',
  schema: [
    { key: 'height', label: '高度', type: 'number', default: 30, min: 5, max: 100, step: 5 },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const height = Math.max(5, Math.min(100, params.height || 30));
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const p = Math.max(0, Math.min(1, progress));

    const restitution = 0.55;
    const gravity = 9.8 / speed;
    const bounceY = -gravityBounce(p, restitution, gravity) * height;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + bounceY
      },
      opacity: 1
    };
  }
};
