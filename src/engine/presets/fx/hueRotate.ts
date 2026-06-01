import { PresetDefinition } from '../types';
import { inertiaDecay } from '../../utils/easing';

export const hueRotate: PresetDefinition = {
  id: 'fx_hueRotate',
  name: '色相旋转 (Hue Rotate)',
  category: 'fx',
  schema: [
    { key: 'angle', label: '旋转角度', type: 'number', default: 180, min: 0, max: 360, step: 1 },
    { key: 'animate', label: '动态旋转', type: 'boolean', default: false }
  ],
  apply: (progress, params, currentTransform) => {
    const angle = Math.max(0, Math.min(360, params.angle || 180));
    const animate = params.animate === true;
    const p = Math.max(0, Math.min(1, progress));

    const hueAngle = animate
      ? angle * inertiaDecay(p, 3, 2)
      : angle;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `hue-rotate(${hueAngle}deg)`
    };
  }
};
