import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const saturate: PresetDefinition = {
  id: 'fx_saturate',
  name: '饱和度 (Saturate)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 2, min: 0, max: 5, step: 0.1 },
    { key: 'animate', label: '动态', type: 'boolean', default: false }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(5, params.intensity || 2));
    const animate = params.animate === true;
    const p = Math.max(0, Math.min(1, progress));

    const saturation = animate
      ? 1 + (intensity - 1) * spring(p, 160, 18, 1)
      : intensity;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `saturate(${Math.max(0, saturation)})`
    };
  }
};
