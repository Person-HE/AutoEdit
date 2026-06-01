import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const pulse: PresetDefinition = {
  id: 'emphasis_pulse',
  name: '心跳脉冲 (Pulse)',
  category: 'emphasis',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'strength', label: '强度', type: 'number', default: 0.1, min: 0.02, max: 0.3, step: 0.01 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const strength = Math.max(0.02, Math.min(0.3, params.strength || 0.1));
    const p = Math.max(0, Math.min(1, progress));

    const frequency = speed * 1.5 + 2;
    const dampingRatio = 0.25;
    const oscillation = dampedOscillation(p, frequency, dampingRatio);
    const scaleDelta = 1 + oscillation * strength * 2;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1
    };
  }
};
