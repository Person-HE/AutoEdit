import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const pulse: PresetDefinition = {
  id: 'emphasis_pulse',
  name: '霓虹脉冲 (Neon Pulse)',
  description: '带阻尼衰减的心脏跳动式脉冲',
  category: 'emphasis',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff00a0' },
    { key: 'intensity', label: '强度', type: 'number', default: 0.12, min: 0, max: 0.4, step: 0.01 },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff00a0';
    const intensity = Math.max(0, Math.min(0.4, params.intensity || 0.12));
    const t = Math.max(0, Math.min(1, progress));

    const beat = Math.abs(dampedOscillation(t, 2, 0.35)) * intensity;
    const scale = 1 + beat;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: `drop-shadow(0 0 ${20 + beat * 200}px ${glowColor}) drop-shadow(0 0 ${40 + beat * 300}px ${glowColor}88)`
    };
  }
};
