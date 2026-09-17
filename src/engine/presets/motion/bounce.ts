import { PresetDefinition } from '../types';
import { gravityBounce } from '../../utils/easing';

export const bounce: PresetDefinition = {
  id: 'motion_bounce',
  name: '持续弹跳 (Continuous Bounce)',
  description: '真实物理的持续重力弹跳循环',
  category: 'motion',
  quality: 'viral',
  mood: 'release',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce'],
  schema: [
    { key: 'height', label: '高度', type: 'number', default: 80, min: 0, max: 300 },
    { key: 'glowColor', label: '发光色', type: 'color', default: '#f6e05e' },
  ],
  apply: (progress, params, currentTransform) => {
    const height = Math.max(0, Math.min(300, params.height || 80));
    const glowColor = params.glowColor || '#f6e05e';
    const t = Math.max(0, Math.min(1, progress));

    const bounce = gravityBounce(t, 0.65, 10);
    const y = -height * bounce;
    const squash = 1 + Math.sin(bounce * Math.PI) * 0.08;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + y,
        scale: Math.max(0.001, currentTransform.scale * squash),
      },
      opacity: 1,
      filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 ${-y * 0.2}px 20px ${glowColor}55)`
    };
  }
};
