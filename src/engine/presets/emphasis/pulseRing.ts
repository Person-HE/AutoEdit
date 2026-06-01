import { PresetDefinition } from '../types';
import { snapSpring } from '../../utils/easing';

export const pulseRing: PresetDefinition = {
  id: 'emphasis_pulseRing',
  name: '环形脉冲 (Pulse Ring)',
  category: 'emphasis',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'strength', label: '强度', type: 'number', default: 0.15, min: 0.02, max: 0.4, step: 0.01 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const strength = Math.max(0.02, Math.min(0.4, params.strength || 0.15));
    const p = Math.max(0, Math.min(1, progress));

    const cycleProgress = (p * speed) % 1;
    const tension = 300;
    const friction = 20 + speed * 4;
    const springVal = snapSpring(cycleProgress, tension, friction);

    const scaleDelta = 1 + (1 - springVal) * strength * 2;

    const ringExpansion = (1 - springVal) * strength * 4;
    const ringOpacity = Math.max(0, 1 - springVal) * 0.6;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1,
      filter: `drop-shadow(0 0 ${(ringExpansion * 10).toFixed(1)}px rgba(100,150,255,${ringOpacity.toFixed(2)}))`
    };
  }
};
