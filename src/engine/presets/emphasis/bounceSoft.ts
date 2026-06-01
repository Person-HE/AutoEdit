import { PresetDefinition } from '../types';
import { gravityBounce } from '../../utils/easing';

export const bounceSoft: PresetDefinition = {
  id: 'emphasis_bounceSoft',
  name: '柔和弹跳 (Bounce Soft)',
  category: 'emphasis',
  schema: [
    { key: 'height', label: '高度', type: 'number', default: 15, min: 5, max: 50, step: 5 },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const height = Math.max(5, Math.min(50, params.height || 15));
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const p = Math.max(0, Math.min(1, progress));

    const restitution = 0.75;
    const gravity = 6.0 / speed;
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
