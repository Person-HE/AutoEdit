import { PresetDefinition } from '../types';

export const wobble: PresetDefinition = {
  id: 'emphasis_wobble',
  name: '摇晃 (Wobble)',
  category: 'emphasis',
  schema: [
    { key: 'angle', label: '摇晃角度', type: 'number', default: 8, min: 2, max: 20, step: 1 },
    { key: 'cycles', label: '摇晃次数', type: 'number', default: 3, min: 1, max: 8, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const angle = params.angle || 8;
    const cycles = params.cycles || 3;
    const t = Math.max(0, Math.min(1, progress));
    const envelope = Math.sin(t * Math.PI);
    const rotation = Math.sin(t * cycles * Math.PI * 2) * angle * envelope;
    return {
      transform: { ...currentTransform, rotate: rotation },
      opacity: 1,
    };
  }
};
