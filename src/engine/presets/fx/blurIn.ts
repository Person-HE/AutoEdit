import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const blurIn: PresetDefinition = {
  id: 'fx_blurIn',
  name: '模糊进入 (Blur In)',
  category: 'fx',
  schema: [
    { key: 'startRadius', label: '起始模糊半径', type: 'number', default: 20, min: 0, max: 50, step: 1 },
    { key: 'endRadius', label: '结束模糊半径', type: 'number', default: 0, min: 0, max: 50, step: 1 }
  ],
  apply: (progress, params, currentTransform) => {
    const startRadius = Math.max(0, Math.min(50, params.startRadius || 20));
    const endRadius = Math.max(0, Math.min(50, params.endRadius || 0));
    const p = Math.max(0, Math.min(1, progress));

    const eased = spring(p, 160, 18, 1);
    const blurRadius = startRadius + (endRadius - startRadius) * eased;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `blur(${Math.max(0, blurRadius)}px)`
    };
  }
};
