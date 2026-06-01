import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const floatX: PresetDefinition = {
  id: 'motion_floatX',
  name: 'X轴悬浮 (FloatX)',
  category: 'motion',
  schema: [
    { key: 'range', label: '范围', type: 'number', default: 30, min: 5, max: 100, step: 5 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const range = Math.max(5, Math.min(100, params.range || 30));
    const speed = Math.max(0.1, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const noiseX = perlinNoise1D(p, speed * 3, 0) * 2 - 1;
    const xOffset = noiseX * range;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + xOffset
      },
      opacity: 1
    };
  }
};
