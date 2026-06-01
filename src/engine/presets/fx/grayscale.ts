import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const grayscale: PresetDefinition = {
  id: 'fx_grayscale',
  name: '黑白电影 (B&W)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 100, min: 0, max: 100, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(100, params.intensity || 100));
    const p = Math.max(0, Math.min(1, progress));

    const eased = spring(p, 140, 20, 1);
    const currentIntensity = intensity * eased;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `grayscale(${currentIntensity}%)`
    };
  }
};
