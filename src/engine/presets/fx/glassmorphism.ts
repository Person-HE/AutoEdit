import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const glassmorphism: PresetDefinition = {
  id: 'fx_glassmorphism',
  name: '毛玻璃效果 (Glassmorphism)',
  category: 'fx',
  schema: [
    { key: 'blur', label: '模糊半径', type: 'number', default: 10, min: 0, max: 50, step: 1 },
    { key: 'opacity', label: '透明度', type: 'number', default: 0.7, min: 0, max: 1, step: 0.05 },
    { key: 'brightness', label: '亮度', type: 'number', default: 1.1, min: 0.5, max: 2, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const blurRadius = Math.max(0, Math.min(50, params.blur || 10));
    const opacity = Math.max(0, Math.min(1, params.opacity || 0.7));
    const brightness = Math.max(0.5, Math.min(2, params.brightness || 1.1));
    const p = Math.max(0, Math.min(1, progress));

    const eased = spring(p, 150, 16, 1);
    const animatedBlur = blurRadius * eased;

    return {
      transform: currentTransform,
      opacity: Math.max(0, Math.min(1, opacity)),
      filter: `blur(${Math.max(0, animatedBlur)}px) brightness(${brightness})`,
      backgroundColor: `rgba(255, 255, 255, ${0.1 * opacity})`,
      backdropFilter: `blur(${Math.max(0, animatedBlur)}px)`
    };
  }
};
