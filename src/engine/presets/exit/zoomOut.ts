import { PresetDefinition } from '../types';
import { inertiaDecay, easeInExpo, easeInQuint, dampedOscillation } from '../../utils/easing';

export const zoomOut: PresetDefinition = {
  id: 'exit_zoom_out',
  name: '缩小消失 (Zoom Out)',
  category: 'exit',
  schema: [
    { key: 'fadeOut', label: '淡出', type: 'boolean', default: true },
    { key: 'targetScale', label: '目标缩放', type: 'number', default: 0, min: 0, max: 0.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const targetScale = Math.max(0, Math.min(0.5, params.targetScale || 0));
    const fadeOut = params.fadeOut !== false;

    const scaleEased = inertiaDecay(t, 3, 2);
    const scale = 1 - (1 - targetScale) * scaleEased;
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 4, 0.6) * 2 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
        rotation: currentTransform.rotation + wobble
      },
      opacity: fadeOut ? Math.max(0.01, 1 - opacityEased) : 1
    };
  }
};
