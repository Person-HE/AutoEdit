import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const glowPulse: PresetDefinition = {
  id: 'fx_glow_pulse',
  name: '光晕脉冲 (Glow Pulse)',
  description: '节奏感光晕脉冲，适合高潮点',
  category: 'fx',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const pulse = Math.abs(dampedOscillation(t, 2.5, 0.3));

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(0 0 ${20 + pulse * 80}px ${glowColor}) drop-shadow(0 0 ${40 + pulse * 120}px ${glowColor}66) brightness(${1 + pulse * 0.2})`
    };
  }
};
