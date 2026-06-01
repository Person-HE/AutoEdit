import { PresetDefinition } from '../types';
import { gravityBounce, springBounce, easeOutExpo } from '../../utils/easing';

export const bounceIn: PresetDefinition = {
  id: 'entrance_bounce_in',
  name: '弹跳进入 (Bounce In)',
  category: 'entrance',
  schema: [
    { key: 'delay', label: '延迟(s)', type: 'number', default: 0, min: 0, max: 2, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const delay = Math.max(0, Math.min(2, params.delay || 0));
    const delayedProgress = Math.max(0, progress - delay);

    if (delayedProgress <= 0) {
      return {
        transform: { ...currentTransform, scale: 0.001 },
        opacity: 0.01
      };
    }

    const effectiveProgress = Math.min(1, delayedProgress / Math.max(0.1, 1 - delay));
    const t = Math.max(0, Math.min(1, effectiveProgress));
    const bounceScale = gravityBounce(t, 0.5, 12);
    const settleScale = springBounce(t, 3, 4);
    const combinedScale = bounceScale * 0.85 + settleScale * 0.15;
    const wobble = t < 1 ? Math.sin(t * Math.PI * 4) * 0.03 * (1 - t) * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (combinedScale + wobble))
      },
      opacity: Math.max(0.01, Math.min(1, easeOutExpo(t)))
    };
  }
};
