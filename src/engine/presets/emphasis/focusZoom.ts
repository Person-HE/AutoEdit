import { PresetDefinition } from '../types';
import { spring, easeOutExpo } from '../../utils/easing';

export const focusZoom: PresetDefinition = {
  id: 'emphasis_focus_zoom',
  name: '焦点聚焦 (Focus Zoom)',
  description: '快速聚焦放大后稳定，引导视觉重心',
  category: 'emphasis',
  quality: 'viral',
  mood: 'tension',
  material: 'metal',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff0055' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff0055';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 180, 14, 1);
    const scale = 1 + springValue * 0.18;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: `drop-shadow(0 0 15px ${glowColor}) drop-shadow(0 0 40px ${glowColor}88) brightness(1 + ${springValue * 0.15})`
    };
  }
};
