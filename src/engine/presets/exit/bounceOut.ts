import { PresetDefinition } from '../types';
import { gravityBounce, easeInExpo, easeInQuint, dampedOscillation } from '../../utils/easing';

export const bounceOut: PresetDefinition = {
  id: 'exit_bounce_out',
  name: '弹跳消失 (Bounce Out)',
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
    }
  ],
  apply: (progress, params, currentTransform) => {
    const t = Math.max(0, Math.min(1, progress));
    const targetScale = Math.max(0, Math.min(0.5, params.targetScale || 0));
    const fadeOut = params.fadeOut !== false;

    const bounceEased = gravityBounce(t, 0.5, 9.8);
    const scale = 1 - (1 - targetScale) * bounceEased;
    const opacityEased = easeInExpo(t);
    const wobble = dampedOscillation(t, 5, 0.3) * 4 * (1 - t);
    const squash = 1 + dampedOscillation(t, 6, 0.5) * 0.08 * (1 - t);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scale * squash),
        rotation: currentTransform.rotation + wobble
      },
      opacity: fadeOut ? Math.max(0.01, 1 - opacityEased) : 1
    };
  }
};
