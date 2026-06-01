import { PresetDefinition } from '../types';

export const heartbeat: PresetDefinition = {
  id: 'emphasis_heartbeat',
  name: '心跳 (Heartbeat)',
  category: 'emphasis',
  schema: [
    { key: 'strength', label: '强度', type: 'number', default: 0.15, min: 0.05, max: 0.3, step: 0.01 },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 1, max: 4, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const strength = Math.max(0.05, Math.min(0.3, params.strength || 0.15));
    const speed = Math.max(1, Math.min(4, params.speed || 2));
    const p = Math.max(0, Math.min(1, progress));

    const cycleT = (p * speed) % 1;

    const systoleDuration = 0.35;
    const s1Peak = 0.12;
    const s2Peak = 0.28;

    const s1Width = 0.06;
    const s2Width = 0.08;

    const s1 = Math.exp(-Math.pow((cycleT - s1Peak) / s1Width, 2));
    const s2 = Math.exp(-Math.pow((cycleT - s2Peak) / s2Width, 2)) * 0.6;

    let diastoleContraction = 0;
    if (cycleT > systoleDuration && cycleT < systoleDuration + 0.08) {
      const dt = (cycleT - systoleDuration) / 0.08;
      diastoleContraction = -Math.sin(dt * Math.PI) * 0.15;
    }

    const scaleDelta = 1 + (s1 + s2) * strength + diastoleContraction * strength;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1
    };
  }
};
