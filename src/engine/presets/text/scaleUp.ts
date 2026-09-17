import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const scaleUp: PresetDefinition = {
  id: 'text_scale_up',
  name: '文字弹大 (Text Scale Pop)',
  description: '文字弹性放大出现，带霓虹描边',
  category: 'text',
  quality: 'viral',
  mood: 'excitement',
  material: 'neon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'glowColor', label: '发光色', type: 'color', default: '#ff00a0' },
  ],
  apply: (progress, params, currentTransform) => {
    const glowColor = params.glowColor || '#ff00a0';
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, 180, 12, 1);
    const scale = 0.6 + 0.4 * springValue;
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.22) * 0.03 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + wobble)),
      },
      opacity: Math.max(0.01, easeOutExpo(t)),
      filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 24px ${glowColor}88)`
    };
  }
};
