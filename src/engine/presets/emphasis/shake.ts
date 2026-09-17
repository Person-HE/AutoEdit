import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const shake: PresetDefinition = {
  id: 'emphasis_shake',
  name: '剧烈震动 (Heavy Shake)',
  description: '带阻尼衰减的剧烈位置震动',
  category: 'emphasis',
  quality: 'viral',
  mood: 'urgency',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 14, min: 0, max: 50, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(50, params.intensity || 14));
    const t = Math.max(0, Math.min(1, progress));

    const envelope = Math.exp(-t * 4);
    const shakeX = perlinNoise1D(t, 20, 0) * intensity * envelope;
    const shakeY = perlinNoise1D(t, 24, 5) * intensity * 0.6 * envelope;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + shakeX,
        y: currentTransform.y + shakeY,
      },
      opacity: 1,
      filter: `drop-shadow(${shakeX * 0.5}px 0 0 rgba(255,0,0,0.4)) drop-shadow(-${shakeX * 0.5}px 0 0 rgba(0,255,255,0.4))`
    };
  }
};
