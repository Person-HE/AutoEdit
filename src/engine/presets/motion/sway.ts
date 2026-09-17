import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const sway: PresetDefinition = {
  id: 'motion_sway',
  name: '摇摆晃动 (Sway)',
  description: '带惯性的左右摇摆，适合文字强调',
  category: 'motion',
  quality: 'viral',
  mood: 'release',
  material: 'liquid',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'amplitude', label: '振幅', type: 'number', default: 8, min: 0, max: 30 },
  ],
  apply: (progress, params, currentTransform) => {
    const amplitude = Math.max(0, Math.min(30, params.amplitude || 8));
    const t = Math.max(0, Math.min(1, progress));

    const rotation = dampedOscillation(t, 1.5, 0.25) * amplitude;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotation,
      },
      opacity: 1,
      filter: 'drop-shadow(0 0 12px rgba(0,240,255,0.3))'
    };
  }
};
