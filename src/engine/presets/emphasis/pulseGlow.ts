import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const pulseGlow: PresetDefinition = {
  id: 'emphasis_pulseGlow',
  name: '发光脉冲 (Pulse Glow)',
  category: 'emphasis',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'strength', label: '强度', type: 'number', default: 0.12, min: 0.02, max: 0.3, step: 0.01 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(0.5, Math.min(5, params.speed || 2));
    const strength = Math.max(0.02, Math.min(0.3, params.strength || 0.12));
    const p = Math.max(0, Math.min(1, progress));

    const frequency = speed * 1.5 + 2;
    const dampingRatio = 0.25;
    const oscillation = dampedOscillation(p, frequency, dampingRatio);
    const scaleDelta = 1 + oscillation * strength * 1.5;

    const glowIntensity = Math.abs(oscillation) * strength * 8;
    const brightness = 1 + glowIntensity * 0.6;
    const blur = glowIntensity * 3;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1,
      filter: `brightness(${brightness.toFixed(2)}) drop-shadow(0 0 ${blur.toFixed(1)}px rgba(255,255,255,${(glowIntensity * 0.5).toFixed(2)}))`
    };
  }
};
