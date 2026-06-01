import { PresetDefinition } from '../types';
import { gravityBounce } from '../../utils/easing';

export const bounce: PresetDefinition = {
  id: 'motion_bounce',
  name: '弹跳 (Bounce)',
  category: 'motion',
  schema: [
    { key: 'height', label: '高度', type: 'number', default: 50, min: 10, max: 200, step: 10 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const height = Math.max(10, Math.min(200, params.height || 50));
    const speed = Math.max(0.5, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const restitution = 0.5 + (1 - speed / 3) * 0.3;
    const gravity = 9.8 * speed;
    const bounceFactor = gravityBounce(p, restitution, gravity);
    const y = bounceFactor * height;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y - y
      },
      opacity: 1
    };
  }
};
