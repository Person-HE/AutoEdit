import { PresetDefinition } from '../types';
import { elasticOut, easeOutExpo } from '../../utils/easing';

export const elasticBounce: PresetDefinition = {
  id: 'entrance_elastic_bounce',
  name: '弹性弹跳 (Elastic Bounce)',
  category: 'entrance',
  schema: [
    { key: 'direction', label: '方向', type: 'string', default: 'down' },
    { key: 'distance', label: '距离', type: 'number', default: 600, min: 100, max: 1200, step: 50 },
  ],
  apply: (progress, params, currentTransform) => {
    const direction = params.direction || 'down';
    const distance = Math.max(100, Math.min(1200, params.distance || 600));
    const t = Math.max(0, Math.min(1, progress));

    const elastic = elasticOut(t, 1, 0.4);
    const fade = easeOutExpo(t);
    const offset = distance * (1 - elastic);

    const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
    const sign = direction === 'left' || direction === 'up' ? -1 : 1;

    return {
      transform: {
        ...currentTransform,
        [axis]: currentTransform[axis] + offset * sign,
        scale: Math.max(0.001, currentTransform.scale * (0.5 + 0.5 * fade))
      },
      opacity: Math.max(0.01, fade)
    };
  }
};
