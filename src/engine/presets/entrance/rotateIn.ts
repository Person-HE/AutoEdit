import { PresetDefinition } from '../types';
import { spring, dampedOscillation, easeOutExpo } from '../../utils/easing';

export const rotateIn: PresetDefinition = {
  id: 'entrance_rotate_in',
  name: '旋转进入 (Rotate In)',
  category: 'entrance',
  schema: [
    {
      key: 'rotation',
      label: '旋转角度',
      type: 'number',
      default: 360,
      min: 90,
      max: 720,
      step: 90
    },
    {
      key: 'scaleFrom',
      label: '起始缩放',
      type: 'number',
      default: 0.5,
      min: 0.1,
      max: 1,
      step: 0.1
    }
  ],
  apply: (progress, params, currentTransform) => {
    const rotation = Math.max(90, Math.min(720, params.rotation || 360));
    const scaleFrom = Math.max(0.1, Math.min(1, params.scaleFrom || 0.5));
    const t = Math.max(0, Math.min(1, progress));
    const rotEased = spring(t, 120, 10, 1);
    const scaleEased = spring(t, 140, 12, 1);
    const rotationValue = rotation * (1 - rotEased);
    const scale = scaleFrom + (1 - scaleFrom) * scaleEased;
    const wobble = t < 1 ? dampedOscillation(t, 3, 0.35) * 8 * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        rotation: currentTransform.rotation + rotationValue + wobble,
        scale: Math.max(0.001, currentTransform.scale * scale)
      },
      opacity: Math.max(0.01, easeOutExpo(t))
    };
  }
};
