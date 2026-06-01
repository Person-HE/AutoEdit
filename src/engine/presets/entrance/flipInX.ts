import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const flipInX: PresetDefinition = {
  id: 'entrance_flip_in_x',
  name: 'X轴翻转进入 (Flip In X)',
  category: 'entrance',
  schema: [
    { key: 'startRotation', label: '起始旋转角度', type: 'number', default: 90, min: 45, max: 180, step: 15 }
  ],
  apply: (progress, params, currentTransform) => {
    const startRotation = Math.max(45, Math.min(180, params.startRotation || 90));
    const t = Math.max(0, Math.min(1, progress));
    const flipEased = spring(t, 150, 11, 1);
    const scaleEased = spring(t, 140, 12, 1);
    const rotationX = startRotation * (1 - flipEased);
    const scale = 0.5 + 0.5 * scaleEased;
    const wobble = t < 1 ? dampedOscillation(t, 4, 0.4) * 5 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotationX + wobble,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: Math.max(0.01, easeOutExpo(t))
    };
  }
};
