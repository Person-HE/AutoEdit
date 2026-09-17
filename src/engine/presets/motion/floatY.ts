import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const floatY: PresetDefinition = {
  id: 'motion_float_y',
  name: '垂直漂浮 (Vertical Float)',
  description: '带正弦波阻尼的轻柔上下漂浮',
  category: 'motion',
  quality: 'viral',
  mood: 'calm',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'amplitude', label: '振幅', type: 'number', default: 25, min: 0, max: 120 },
    { key: 'frequency', label: '频率', type: 'number', default: 2, min: 0.5, max: 6, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const amplitude = Math.max(0, Math.min(120, params.amplitude || 25));
    const frequency = Math.max(0.5, Math.min(6, params.frequency || 2));
    const t = Math.max(0, Math.min(1, progress));

    const y = dampedOscillation(t, frequency, 0.05) * amplitude;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
      },
      opacity: 1,
      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
    };
  }
};
