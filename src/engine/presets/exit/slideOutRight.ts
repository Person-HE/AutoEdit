import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const slideOutRight: PresetDefinition = {
  id: 'exit_slide_out_right',
  name: '惯性右出 (Inertia Slide Right)',
  description: '带拖尾的向右惯性退出',
  category: 'exit',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 600, min: 100, max: 2000 },
    { key: 'glowColor', label: '拖尾色', type: 'color', default: '#00ff9d' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(100, Math.min(2000, params.distance || 600));
    const glowColor = params.glowColor || '#00ff9d';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const x = distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        rotateY: (currentTransform.rotateY || 0) + t * 30,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.1)),
      },
      opacity: Math.max(0, opacity),
      filter: `drop-shadow(-${distance * 0.02 * t}px 0 20px ${glowColor}66) drop-shadow(0 0 10px ${glowColor})`
    };
  }
};
