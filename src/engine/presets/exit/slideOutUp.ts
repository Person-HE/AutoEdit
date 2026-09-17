import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const slideOutUp: PresetDefinition = {
  id: 'exit_slide_out_up',
  name: '弹射上出 (Launch Out Up)',
  description: '带惯性的向上弹射退出',
  category: 'exit',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 500, min: 100, max: 1500 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(1500, params.distance || 500));
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const y = -distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.1)),
      },
      opacity: Math.max(0, opacity),
      filter: `drop-shadow(0 ${distance * 0.02 * t}px 20px ${glowColor}66) drop-shadow(0 0 10px ${glowColor})`
    };
  }
};
