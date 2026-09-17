import { PresetDefinition } from '../types';
import { perlinNoise1D, spring, easeOutExpo } from '../../utils/easing';

export const glitchIn: PresetDefinition = {
  id: 'entrance_glitch_in',
  name: '赛博故障进入 (Cyber Glitch In)',
  description: '数字解码式故障进入，带 RGB 分离、扫描线和霓虹发光',
  category: 'entrance',
  quality: 'viral',
  mood: 'urgency',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['perlinNoise1D', 'spring', 'easeOutExpo'],
  schema: [
    { key: 'glitchColor', label: '故障主色', type: 'color', default: '#00f0ff' },
    { key: 'intensity', label: '故障强度', type: 'number', default: 22, min: 0, max: 60, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const glitchColor = params.glitchColor || '#00f0ff';
    const intensity = Math.max(0, Math.min(60, params.intensity || 22));
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 160, 14, 1);
    const scale = 0.85 + 0.15 * springValue;
    const noise = perlinNoise1D(t, 12, 0);
    const jitterX = noise * intensity * (1 - springValue);
    const jitterY = perlinNoise1D(t, 16, 5) * intensity * 0.4 * (1 - springValue);
    const chroma = (1 - springValue) * 8;
    const opacity = easeOutExpo(t);

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + jitterX,
        y: currentTransform.y + jitterY,
        scale: Math.max(0.001, currentTransform.scale * scale),
        skewX: (currentTransform.skewX || 0) + noise * 12 * (1 - springValue),
      },
      opacity: Math.max(0.01, opacity),
      filter: `drop-shadow(0 0 12px ${glitchColor}) drop-shadow(${chroma}px 0 0 rgba(255,0,0,0.55)) drop-shadow(-${chroma}px 0 0 rgba(0,255,255,0.55))`
    };
  }
};
