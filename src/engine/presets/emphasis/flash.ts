import { PresetDefinition } from '../types';

export const flash: PresetDefinition = {
  id: 'emphasis_flash',
  name: '闪烁 (Flash)',
  category: 'emphasis',
  schema: [
    { key: 'times', label: '闪烁次数', type: 'number', default: 3, min: 1, max: 8, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const times = params.times || 3;
    const t = Math.max(0, Math.min(1, progress));
    const flashCycle = Math.abs(Math.sin(t * times * Math.PI));
    return {
      transform: { ...currentTransform },
      opacity: 1 - flashCycle * 0.7,
    };
  }
};
