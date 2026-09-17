import { PresetDefinition } from '../types';
import { spring, whipEffect, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const smashIn: PresetDefinition = {
  id: 'entrance_smash_in',
  name: '爆裂重击 (Smash Impact)',
  description: '高速冲击后剧烈回弹，带 RGB 色散和屏幕震动质感',
  category: 'entrance',
  quality: 'viral',
  mood: 'excitement',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'whipEffect', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'impactColor', label: '冲击色', type: 'color', default: '#ff0055' },
    { key: 'shake', label: '震动强度', type: 'number', default: 18, min: 0, max: 60, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const impactColor = params.impactColor || '#ff0055';
    const shake = Math.max(0, Math.min(60, params.shake || 18));
    const t = Math.max(0, Math.min(1, progress));

    const whip = whipEffect(t, 0.55);
    const settle = spring(t, 220, 10, 1);
    const scale = 1.45 - 0.45 * whip + 0.08 * (settle - whip) * (1 - t);
    const rotate = Math.sin(t * Math.PI * 6) * shake * (1 - t) * t;
    const chroma = (1 - whip) * 10;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
        rotation: currentTransform.rotation + rotate,
      },
      opacity: Math.max(0.01, easeOutExpo(Math.min(1, t * 1.4))),
      filter: `drop-shadow(0 0 20px ${impactColor}) drop-shadow(0 0 60px ${impactColor}99) drop-shadow(${chroma}px 0 0 rgba(255,0,0,0.6)) drop-shadow(-${chroma}px 0 0 rgba(0,255,255,0.6))`
    };
  }
};
