import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const blur: PresetDefinition = {
  id: 'fx_blur',
  name: '高斯模糊 (Blur)',
  category: 'fx',
  schema: [
    { key: 'radius', label: '半径', type: 'number', default: 10, min: 0, max: 50, step: 1 },
    { key: 'animate', label: '动态模糊', type: 'boolean', default: false }
  ],
  apply: (progress, params, currentTransform) => {
    const radius = Math.max(0, Math.min(50, params.radius || 10));
    const animate = params.animate === true;
    const p = Math.max(0, Math.min(1, progress));

    const blurRadius = animate
      ? radius * spring(p, 200, 16, 1) * (1 - spring(p, 200, 16, 1)) * 4
      : radius;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `blur(${Math.max(0, blurRadius)}px)`
    };
  }
};
