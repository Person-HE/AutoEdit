import { PresetDefinition } from '../types';

export const jitter: PresetDefinition = {
  id: 'emphasis_jitter',
  name: '抖动 (Jitter)',
  category: 'emphasis',
  schema: [
    { key: 'intensity', label: '抖动强度', type: 'number', default: 3, min: 1, max: 10, step: 0.5 },
    { key: 'frequency', label: '抖动频率', type: 'number', default: 20, min: 5, max: 50, step: 5 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = params.intensity || 3;
    const frequency = params.frequency || 20;
    const t = Math.max(0, Math.min(1, progress));
    const envelope = Math.sin(t * Math.PI);
    const jitterX = Math.sin(t * frequency * Math.PI) * intensity * envelope;
    const jitterY = Math.cos(t * frequency * 1.3 * Math.PI) * intensity * envelope;
    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY,
      },
      opacity: 1,
    };
  }
};
