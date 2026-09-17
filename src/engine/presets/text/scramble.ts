import { PresetDefinition } from '../types';
import { perlinNoise1D, easeOutExpo } from '../../utils/easing';

export const scramble: PresetDefinition = {
  id: 'text_scramble',
  name: '乱码重组 (Text Scramble)',
  description: '赛博朋克风格字符乱码后重组',
  category: 'text',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00ff9d' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00ff9d';
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 14, 0);
    const jitter = noise * 4 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitter,
        skewX: (currentTransform.skewX || 0) + noise * 8 * (1 - t),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 20px ${glowColor}88)`
    };
  }
};
