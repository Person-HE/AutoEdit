import { PresetDefinition } from '../types';
import { easeInExpo } from '../../utils/easing';

export const fadeOutDown: PresetDefinition = {
  id: 'exit_fade_out_down',
  name: '下沉淡出 (Fade Out Down)',
  description: '向下沉降并淡出，带重量感',
  category: 'exit',
  quality: 'viral',
  mood: 'tension',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeInExpo'],
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 160, min: 0, max: 800 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff0055' },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(800, params.distance || 160));
    const glowColor = params.glowColor || '#ff0055';
    const t = Math.max(0, Math.min(1, progress));

    const ease = easeInExpo(t);
    const y = distance * ease;
    const opacity = 1 - ease;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * (1 - t * 0.15)),
      },
      opacity: Math.max(0, opacity),
      filter: `drop-shadow(0 -${distance * 0.05 * t}px 20px ${glowColor}66)`
    };
  }
};
