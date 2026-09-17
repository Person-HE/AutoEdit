import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const glow: PresetDefinition = {
  id: 'fx_glow',
  name: '霓虹辉光 (Neon Glow)',
  description: '持续霓虹辉光脉冲，增强材质发光感',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
    { key: 'intensity', label: '强度', type: 'number', default: 20, min: 0, max: 80, step: 1 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const intensity = Math.max(0, Math.min(80, params.intensity || 20));
    const t = Math.max(0, Math.min(1, progress));

    const pulse = Math.sin(t * Math.PI * 4) * 0.3 + 0.7;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(0 0 ${intensity * pulse}px ${glowColor}) drop-shadow(0 0 ${intensity * 2 * pulse}px ${glowColor}66) brightness(1.1)`
    };
  }
};
