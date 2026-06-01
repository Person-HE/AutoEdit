import { PresetDefinition } from '../types';
import { spring, elasticOut, easeOutExpo } from '../../utils/easing';

export const elasticIn: PresetDefinition = {
  id: 'entrance_elastic_in',
  name: '弹性进入 (Elastic In)',
  category: 'entrance',
  schema: [
    { key: 'startScale', label: '起始缩放', type: 'number', default: 0.3, min: 0.1, max: 0.9, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const startScale = Math.max(0.1, Math.min(0.9, params.startScale || 0.3));
    const t = Math.max(0, Math.min(1, progress));
    const scaleEased = spring(t, 180, 8, 1);
    const elasticSettle = elasticOut(t, 1.2, 0.4);
    const combinedScale = scaleEased * 0.7 + elasticSettle * 0.3;
    const scale = startScale + (1 - startScale) * combinedScale;
    const wobble = t < 1 ? Math.sin(t * Math.PI * 5) * 0.02 * (1 - t) * (1 - t) : 0;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (scale + wobble))
      },
      opacity: Math.max(0.01, easeOutExpo(t))
    };
  }
};
