import { PresetDefinition } from '../types';
import { gravityBounce, easeInExpo } from '../../utils/easing';

export const bounceOut: PresetDefinition = {
  id: 'exit_bounce_out',
  name: '弹跳消失 (Bounce Out)',
  description: '真实重力弹跳后缩小消失',
  category: 'exit',
  quality: 'viral',
  mood: 'release',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce', 'easeInExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#f6e05e' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#f6e05e';
    const t = Math.max(0, Math.min(1, progress));

    const bounce = gravityBounce(t, 0.5, 12);
    const y = 180 * (1 - bounce);
    const scale = 1 - easeInExpo(t) * 0.5;
    const opacity = 1 - easeInExpo(t);

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: Math.max(0, opacity),
      filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 30px ${glowColor}66)`
    };
  }
};
