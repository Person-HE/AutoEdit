import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const shadowLift: PresetDefinition = {
  id: 'fx_shadowLift',
  name: '阴影提升 (Shadow Lift)',
  category: 'fx',
  schema: [
    { key: 'color', label: '阴影颜色', type: 'color', default: '#000000' },
    { key: 'maxBlur', label: '最大模糊半径', type: 'number', default: 30, min: 0, max: 100, step: 5 },
    { key: 'maxOffset', label: '最大偏移', type: 'number', default: 20, min: 0, max: 50, step: 5 },
    { key: 'opacity', label: '不透明度', type: 'number', default: 0.4, min: 0, max: 1, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#000000';
    const maxBlur = Math.max(0, Math.min(100, params.maxBlur || 30));
    const maxOffset = Math.max(0, Math.min(50, params.maxOffset || 20));
    const opacity = Math.max(0, Math.min(1, params.opacity || 0.4));
    const p = Math.max(0, Math.min(1, progress));

    const eased = spring(p, 200, 22, 1);

    const currentBlur = maxBlur * eased;
    const currentOffset = maxOffset * eased;
    const currentOpacity = opacity * eased;

    const hexOpacity = Math.round(currentOpacity * 255).toString(16).padStart(2, '0');

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(${currentOffset}px ${currentOffset}px ${currentBlur}px ${color}${hexOpacity})`
    };
  }
};
