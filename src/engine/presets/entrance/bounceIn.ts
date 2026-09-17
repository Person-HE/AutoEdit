import { PresetDefinition } from '../types';
import { gravityBounce, easeOutExpo } from '../../utils/easing';

export const bounceIn: PresetDefinition = {
  id: 'entrance_bounce_in',
  name: '重力弹跳进入 (Gravity Bounce In)',
  description: '真实重力弹跳入场，带惯性和弹性反馈',
  category: 'entrance',
  quality: 'viral',
  mood: 'release',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#f6e05e' },
    { key: 'height', label: '弹跳高度', type: 'number', default: 180, min: 0, max: 600 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#f6e05e';
    const height = Math.max(0, Math.min(600, params.height || 180));
    const t = Math.max(0, Math.min(1, progress));

    const bounce = gravityBounce(t, 0.55, 12);
    const y = -height * (1 - bounce);
    const squash = 1 + Math.sin(bounce * Math.PI) * 0.12;
    const stretch = 1 / squash;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * stretch * squash),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 30px ${glowColor}88)`
    };
  }
};
