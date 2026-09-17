import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const scanline: PresetDefinition = {
  id: 'fx_scanline',
  name: '扫描线叠加 (Scanline Overlay)',
  description: '复古 CRT 扫描线效果，增强怀旧科技感',
  category: 'fx',
  quality: 'viral',
  mood: 'mysterious',
  material: 'carbon',
  dimensions: { materialOptics: true, physicsMotion: false, spatialDepth: false, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'lineColor', label: '线条色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const lineColor = params.lineColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const roll = Math.sin(t * Math.PI * 6) * 2;

    return {
      transform: {
        ...currentTransform,
        y: currentTransform.y + roll,
      },
      opacity: 1,
      filter: `drop-shadow(0 0 4px ${lineColor}) contrast(1.1)`
    };
  }
};
