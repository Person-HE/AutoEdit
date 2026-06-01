import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const focusZoom: PresetDefinition = {
  id: 'emphasis_focus_zoom',
  name: '聚焦缩放 (Focus Zoom)',
  category: 'emphasis',
  schema: [
    { key: 'scale', label: '缩放幅度', type: 'number', default: 0.2, min: 0.05, max: 0.5, step: 0.05 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const scaleAmount = Math.max(0.05, Math.min(0.5, params.scale || 0.2));
    const speed = Math.max(0.5, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const stiffness = 120 + speed * 80;
    const damping = 10 + speed * 4;
    const springVal = spring(p, stiffness, damping, 1);
    const scaleDelta = 1 + scaleAmount * (1 - springVal);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1
    };
  }
};
