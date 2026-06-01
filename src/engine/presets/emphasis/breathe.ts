import { PresetDefinition } from '../types';

export const breathe: PresetDefinition = {
  id: 'emphasis_breathe',
  name: '呼吸 (Breathe)',
  category: 'emphasis',
  schema: [
    { key: 'strength', label: '强度', type: 'number', default: 0.08, min: 0.02, max: 0.2, step: 0.01 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const strength = Math.max(0.02, Math.min(0.2, params.strength || 0.08));
    const speed = Math.max(0.5, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const cycleT = (p * speed) % 1;

    const inhaleRatio = 0.4;
    let warpedT: number;
    if (cycleT < inhaleRatio) {
      warpedT = (cycleT / inhaleRatio) * 0.5;
    } else {
      warpedT = 0.5 + ((cycleT - inhaleRatio) / (1 - inhaleRatio)) * 0.5;
    }

    const breatheVal = Math.sin(warpedT * Math.PI * 2) * 0.5 + 0.5;
    const scaleDelta = 1 + breatheVal * strength;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1
    };
  }
};
