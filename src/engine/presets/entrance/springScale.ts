import { PresetDefinition } from '../types';
import { spring, dampedOscillation } from '../../utils/easing';

export const springScale: PresetDefinition = {
  id: 'entrance_spring_scale',
  name: '弹簧缩放 (Spring Scale)',
  category: 'entrance',
  schema: [
    { key: 'stiffness', label: '刚度', type: 'number', default: 180, min: 50, max: 400, step: 10 },
    { key: 'damping', label: '阻尼', type: 'number', default: 12, min: 5, max: 30, step: 1 },
    { key: 'startScale', label: '起始缩放', type: 'number', default: 0.3, min: 0.1, max: 1, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const stiffness = Math.max(50, Math.min(400, params.stiffness || 180));
    const damping = Math.max(5, Math.min(30, params.damping || 12));
    const startScale = Math.max(0.1, Math.min(1, params.startScale || 0.3));
    const t = Math.max(0, Math.min(1, progress));

    const springValue = spring(t, stiffness, damping, 1);
    const overshoot = t < 1 ? dampedOscillation(t, 3, 0.2) * 0.04 * (1 - t) : 0;
    const scale = startScale + (1 - startScale) * springValue;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + overshoot))
      },
      opacity: Math.max(0.01, t < 0.1 ? t * 10 : 1)
    };
  }
};
