import { PresetDefinition } from '../types';
import { momentumEase } from '../../utils/easing';

export const driftSlow: PresetDefinition = {
  id: 'motion_driftSlow',
  name: '慢速漂移 (DriftSlow)',
  category: 'motion',
  schema: [
    { key: 'distance', label: '距离', type: 'number', default: 50, min: 10, max: 300, step: 10 },
    { key: 'direction', label: '方向', type: 'number', default: 45, min: 0, max: 360, step: 15 }
  ],
  apply: (progress, params, currentTransform) => {
    const distance = Math.max(10, Math.min(300, params.distance || 50));
    const direction = Math.max(0, Math.min(360, params.direction || 45));
    const p = Math.max(0, Math.min(1, progress));

    const eased = momentumEase(p, 2, 0.6);
    const angleRad = (direction * Math.PI) / 180;
    const xOffset = Math.cos(angleRad) * distance * eased;
    const yOffset = Math.sin(angleRad) * distance * eased;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + xOffset,
        y: currentTransform.y + yOffset
      },
      opacity: 1
    };
  }
};
