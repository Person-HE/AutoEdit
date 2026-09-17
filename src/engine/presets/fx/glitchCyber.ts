import { PresetDefinition } from '../types';
import { perlinNoise1D, dampedOscillation } from '../../utils/easing';

export const glitchCyber: PresetDefinition = {
  id: 'fx_glitch_cyber',
  name: '赛博故障 (Cyber Glitch FX)',
  description: '持续赛博故障 RGB 分离和抖动',
  category: 'fx',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 8, min: 0, max: 30, step: 0.5 },
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(30, params.intensity || 8));
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 10, 0);
    const jitter = noise * intensity;
    const chroma = intensity * 0.6;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitter,
        y: currentTransform.y + perlinNoise1D(t, 12, 5) * intensity * 0.4,
      },
      opacity: 1,
      filter: `drop-shadow(${chroma}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-${chroma}px 0 0 rgba(0,255,255,0.5))`
    };
  }
};
