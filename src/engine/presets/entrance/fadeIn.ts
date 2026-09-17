import { PresetDefinition } from '../types';
import { easeOutExpo } from '../../utils/easing';

export const fadeIn: PresetDefinition = {
  id: 'entrance_fade_in',
  name: '淡入 (Fade In)',
  category: 'entrance',
  schema: [
    { key: 'startOpacity', label: '起始透明度', type: 'number', default: 0, min: 0, max: 0.5, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const startOpacity = params.startOpacity ?? 0;
    const t = Math.max(0, Math.min(1, progress));
    return {
      transform: { ...currentTransform },
      opacity: startOpacity + (1 - startOpacity) * easeOutExpo(t),
    };
  }
};
