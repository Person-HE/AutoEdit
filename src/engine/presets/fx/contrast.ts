import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const contrast: PresetDefinition = {
  id: 'fx_contrast',
  name: '对比度 (Contrast)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 1.5, min: 0, max: 3, step: 0.1 },
    { key: 'animate', label: '动态', type: 'boolean', default: false }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(3, params.intensity || 1.5));
    const animate = params.animate === true;
    const p = Math.max(0, Math.min(1, progress));

    const contrastValue = animate
      ? 1 + (intensity - 1) * spring(p, 160, 18, 1)
      : intensity;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `contrast(${Math.max(0, contrastValue)})`
    };
  }
};
