import { PresetDefinition } from '../types';
import { perlinNoise1D, easeOutExpo } from '../../utils/easing';

export const decode: PresetDefinition = {
  id: 'text_decode',
  name: '数字解码 (Digital Decode)',
  description: '字符从乱码解码成目标文字，带故障残影',
  category: 'text',
  quality: 'viral',
  mood: 'mysterious',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 10, 0);
    const jitter = noise * 6 * (1 - t);
    const chroma = (1 - t) * 5;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitter,
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(${chroma}px 0 0 rgba(0,255,255,0.5)) drop-shadow(-${chroma}px 0 0 rgba(255,0,255,0.5))`
    };
  }
};
