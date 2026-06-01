import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const jitter: PresetDefinition = {
  id: 'emphasis_jitter',
  name: '抖动 (Jitter)',
  category: 'emphasis',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 5, min: 1, max: 20, step: 1 },
    { key: 'frequency', label: '频率', type: 'number', default: 15, min: 5, max: 50, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(1, Math.min(20, params.intensity || 5));
    const frequency = Math.max(5, Math.min(50, params.frequency || 15));
    const p = Math.max(0, Math.min(1, progress));

    const decay = 1 - p * 0.5;

    const noiseX = (perlinNoise1D(p, frequency, 0) - 0.5) * 2;
    const noiseY = (perlinNoise1D(p, frequency, 137.5) - 0.5) * 2;

    const jitterX = noiseX * intensity * decay;
    const jitterY = noiseY * intensity * decay;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY
      },
      opacity: 1
    };
  }
};
