import { PresetDefinition } from '../types';
import { inertiaDecay, gravityBounce, easeInExpo, dampedOscillation } from '../../utils/easing';

export const zoomOutUp: PresetDefinition = {
  id: 'exit_zoom_out_up',
  name: '向上缩放消失 (Zoom Out Up)',
  category: 'exit',
  schema: [
    {
      key: 'fadeOut',
      label: '淡出',
      type: 'boolean',
      default: true
    },
    {
      key: 'targetScale',
      label: '目标缩放',
      type: 'number',
      default: 0,
      min: 0,
      max: 0.5,
      step: 0.05
    },
    {
      key: 'distance',
      label: '上移距离',
      type: 'number',
      default: 200,
      min: 50,
      max: 500,
      step: 50
    }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const targetScale = Math.max(0, Math.min(0.5, params.targetScale || 0));
    const distance = Math.max(50, Math.min(500, params.distance || 200));
    const fadeOut = params.fadeOut !== false;

    const scaleEased = inertiaDecay(t, 3, 2);
    const scale = 1 - (1 - targetScale) * scaleEased;
    const moveEased = gravityBounce(t, 0.2, 5);
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 3, 0.45) * 2.5 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale),
        y: currentTransform.y - distance * moveEased,
        rotation: currentTransform.rotation + wobble
      },
      opacity: fadeOut ? Math.max(0.01, 1 - opacityEased) : 1
    };
  }
};
