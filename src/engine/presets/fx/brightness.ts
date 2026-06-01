import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const brightness: PresetDefinition = {
  id: 'fx_brightness',
  name: '亮度调节 (Brightness)',
  category: 'fx',
  schema: [
    { key: 'value', label: '亮度', type: 'number', default: 1.5, min: 0, max: 3, step: 0.1 },
    { key: 'animate', label: '动态', type: 'boolean', default: false }
  ],
  apply: (progress, params, currentTransform) => {
    const value = Math.max(0, Math.min(3, params.value || 1.5));
    const animate = params.animate === true;
    const p = Math.max(0, Math.min(1, progress));

    const brightness = animate
      ? 1 + (value - 1) * spring(p, 160, 18, 1)
      : value;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `brightness(${Math.max(0, brightness)})`
    };
  }
};
