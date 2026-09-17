import { PresetDefinition } from '../types';
import { perlinNoise1D, easeInExpo } from '../../utils/easing';

export const glitchOut: PresetDefinition = {
  id: 'exit_glitch_out',
  name: '故障消散 (Glitch Dissolve)',
  description: '数字故障抖动并色散消失',
  category: 'exit',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['perlinNoise1D', 'easeInExpo'],
  schema: [
    { key: 'glitchColor', label: '故障色', type: 'color', default: '#00f0ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 28, min: 0, max: 80, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const glitchColor = params.glitchColor || '#00f0ff';
    const intensity = Math.max(0, Math.min(80, params.intensity || 28));
    const t = Math.max(0, Math.min(1, progress));

    const noise = perlinNoise1D(t, 14, 0);
    const jitterX = noise * intensity * t;
    const jitterY = perlinNoise1D(t, 18, 3) * intensity * 0.4 * t;
    const chroma = t * 10;
    const opacity = 1 - easeInExpo(t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY,
        skewX: (currentTransform.skewX || 0) + noise * 15 * t,
      },
      opacity: Math.max(0, opacity),
      filter: `drop-shadow(0 0 12px ${glitchColor}) drop-shadow(${chroma}px 0 0 rgba(255,0,0,0.55)) drop-shadow(-${chroma}px 0 0 rgba(0,255,255,0.55))`
    };
  }
};
