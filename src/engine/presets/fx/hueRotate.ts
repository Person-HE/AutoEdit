import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const hueRotate: PresetDefinition = {
  id: 'fx_hue_rotate',
  name: '色相漂移 (Hue Shift)',
  description: '霓虹色相循环漂移',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: false, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 1, min: -3, max: 3, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(-3, Math.min(3, params.speed || 1));
    const t = Math.max(0, Math.min(1, progress));

    const hue = t * 360 * speed;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `hue-rotate(${hue}deg) saturate(1.2) brightness(1.05)`
    };
  }
};
