import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const pulseGlow: PresetDefinition = {
  id: 'emphasis_pulse_glow',
  name: '呼吸光晕 (Breathing Glow)',
  description: '节奏感呼吸式光晕缩放',
  category: 'emphasis',
  quality: 'viral',
  mood: 'calm',
  material: 'glass',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const breathe = Math.sin(t * Math.PI * 4) * 0.03;
    const scale = 1 + breathe;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: `drop-shadow(0 0 ${25 + breathe * 400}px ${glowColor}) drop-shadow(0 0 ${50}px ${glowColor}66)`
    };
  }
};
