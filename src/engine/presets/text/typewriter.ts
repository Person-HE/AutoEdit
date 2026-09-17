import { PresetDefinition } from '../types';
import { easeOutExpo } from '../../utils/easing';

export const typewriter: PresetDefinition = {
  id: 'text_typewriter',
  name: '终端打字机 (Terminal Typewriter)',
  description: '代码编辑器风格的逐字出现，带光标闪烁',
  category: 'text',
  quality: 'viral',
  mood: 'mysterious',
  material: 'carbon',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: false, styleEmotion: true },
  physics: ['easeOutExpo'],
  schema: [
    { key: 'cursorColor', label: '光标色', type: 'color', default: '#00ff41' },
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const cursorBlink = Math.sin(t * 30) > 0 ? 1 : 0.3;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `drop-shadow(0 0 4px ${params.cursorColor || '#00ff41'}) drop-shadow(0 0 12px ${params.cursorColor || '#00ff41'}66)`,
      compositeOperation: 'source-over'
    };
  }
};
