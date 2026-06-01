import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const shadow: PresetDefinition = {
  id: 'fx_shadow',
  name: '阴影效果 (Shadow)',
  category: 'fx',
  schema: [
    { key: 'color', label: '阴影颜色', type: 'color', default: '#000000' },
    { key: 'blur', label: '模糊半径', type: 'number', default: 10, min: 0, max: 50, step: 1 },
    { key: 'offsetX', label: 'X轴偏移', type: 'number', default: 5, min: -50, max: 50, step: 1 },
    { key: 'offsetY', label: 'Y轴偏移', type: 'number', default: 5, min: -50, max: 50, step: 1 },
    { key: 'opacity', label: '不透明度', type: 'number', default: 0.5, min: 0, max: 1, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const color = params.color || '#000000';
    const blur = Math.max(0, Math.min(50, params.blur || 10));
    const offsetX = Math.max(-50, Math.min(50, params.offsetX || 5));
    const offsetY = Math.max(-50, Math.min(50, params.offsetY || 5));
    const opacity = Math.max(0, Math.min(1, params.opacity || 0.5));
    const p = Math.max(0, Math.min(1, progress));

    const eased = spring(p, 160, 18, 1);
    const currentOpacity = opacity * eased;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(${offsetX * eased}px ${offsetY * eased}px ${blur * eased}px ${color}${Math.round(currentOpacity * 255).toString(16).padStart(2, '0')})`
    };
  }
};
