import { PresetDefinition } from '../types';
import { dampedOscillation, easeOutExpo } from '../../utils/easing';

export const shockwave: PresetDefinition = {
  id: 'emphasis_shockwave',
  name: '冲击波震荡 (Shockwave)',
  description: '从中心向外扩散的冲击波动效',
  category: 'emphasis',
  quality: 'viral',
  mood: 'epic',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'waveColor', label: '波纹色', type: 'color', default: '#00f0ff' },
  ],
  apply: (progress, params, currentTransform) => {
    const waveColor = params.waveColor || '#00f0ff';
    const t = Math.max(0, Math.min(1, progress));

    const wave = dampedOscillation(t, 2, 0.25);
    const scale = 1 + wave * 0.08;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
      },
      opacity: 1,
      filter: `drop-shadow(0 0 ${20 + Math.abs(wave) * 60}px ${waveColor}) drop-shadow(0 0 ${40 + Math.abs(wave) * 100}px ${waveColor}55)`
    };
  }
};
