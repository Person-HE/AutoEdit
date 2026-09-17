import { PresetDefinition } from '../types';
import { easeInCubic } from '../../utils/easing';

export const zoomOut: PresetDefinition = {
  id: 'exit_zoom_out',
  name: '缩放退出 (Zoom Out)',
  category: 'exit',
  schema: [
    { key: 'endScale', label: '结束缩放', type: 'number', default: 0.3, min: 0.05, max: 0.8, step: 0.05 },
  ],
  apply: (progress, params, currentTransform) => {
    const endScale = params.endScale || 0.3;
    const t = Math.max(0, Math.min(1, progress));
    const eased = easeInCubic(t);
    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * (1 - (1 - endScale) * eased)),
      },
      opacity: 1 - eased,
    };
  }
};
