import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const drift: PresetDefinition = {
  id: 'motion_drift',
  name: '缓慢漂移 (Slow Drift)',
  description: '背景层级的缓慢漂移，制造空间深度',
  category: 'motion',
  quality: 'viral',
  mood: 'calm',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'distance', label: '漂移距离', type: 'number', default: 60, min: 0, max: 300 },
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(0, Math.min(300, params.distance || 60));
    const t = Math.max(0, Math.min(1, progress));

    const x = Math.sin(t * Math.PI * 2) * distance;
    const y = Math.cos(t * Math.PI * 1.3) * distance * 0.4;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        y: currentTransform.y + y,
      },
      opacity: 1,
      filter: 'blur(0px) brightness(1.05)'
    };
  }
};
