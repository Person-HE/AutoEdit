import { PresetDefinition } from '../types';
import { easeInCubic } from '../../utils/easing';

export const fadeOut: PresetDefinition = {
  id: 'exit_fade_out',
  name: '淡出 (Fade Out)',
  category: 'exit',
  schema: [
    { key: 'endOpacity', label: '结束透明度', type: 'number', default: 0, min: 0, max: 0.5, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const endOpacity = params.endOpacity ?? 0;
    const t = Math.max(0, Math.min(1, progress));
    return {
      transform: { ...currentTransform },
      opacity: 1 - (1 - endOpacity) * easeInCubic(t),
    };
  }
};
