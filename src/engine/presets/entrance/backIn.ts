import { PresetDefinition } from '../types';
import { snapSpring, spring, easeOutExpo } from '../../utils/easing';

export const backIn: PresetDefinition = {
  id: 'entrance_back_in',
  name: '回弹进入 (Back In)',
  category: 'entrance',
  schema: [
    { key: 'startScale', label: '起始缩放', type: 'number', default: 0.5, min: 0.1, max: 0.9, step: 0.1 },
    { key: 'overshoot', label: '回弹幅度', type: 'number', default: 1.2, min: 1.05, max: 1.5, step: 0.05 }
  ],
  apply: (progress, params, currentTransform) => {
    const startScale = Math.max(0.1, Math.min(0.9, params.startScale || 0.5));
    const overshoot = Math.max(1.05, Math.min(1.5, params.overshoot || 1.2));
    const t = Math.max(0, Math.min(1, progress));
    const snapEased = snapSpring(t, 350, 24);
    const settleEased = spring(t, 120, 14, 1);
    const primaryScale = startScale + (overshoot - startScale) * snapEased;
    const settleScale = t < 1 ? (settleEased - snapEased) * (1 - startScale) * 0.15 : 0;
    const finalScale = t >= 1 ? 1 : Math.min(primaryScale + settleScale, overshoot);
    const wobble = t < 1 ? Math.sin(t * Math.PI * 3) * 0.015 * (1 - t) * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (finalScale + wobble))
      },
      opacity: Math.max(0.01, easeOutExpo(t))
    };
  }
};
