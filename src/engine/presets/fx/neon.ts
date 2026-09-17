import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const neon: PresetDefinition = {
  id: 'fx_neon',
  name: '霓虹灯管 (Neon Tube)',
  description: '模拟真实霓虹灯管的闪烁和发光',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff00a0' },
    { key: 'flicker', label: '闪烁强度', type: 'number', default: 0.25, min: 0, max: 1, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff00a0';
    const flicker = Math.max(0, Math.min(1, params.flicker || 0.25));
    const t = Math.max(0, Math.min(1, progress));

    const flick = 1 + dampedOscillation(t, 8, 0.5) * flicker;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(0 0 15px ${glowColor}) drop-shadow(0 0 40px ${glowColor}${Math.floor(flick * 128).toString(16).padStart(2,'0')}) brightness(${1 + flick * 0.1})`
    };
  }
};
