import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const orbit: PresetDefinition = {
  id: 'motion_orbit',
  name: '轨道旋转 (Orbit)',
  category: 'motion',
  schema: [
    { key: 'radius', label: '半径', type: 'number', default: 100, min: 10, max: 500, step: 10 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const radius = Math.max(10, Math.min(500, params.radius || 100));
    const speed = Math.max(0.1, Math.min(5, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const speedVariation = 1 + perlinNoise1D(p, speed * 2, 0) * 0.15;
    const angle = p * Math.PI * 2 * speed * speedVariation;
    const xOffset = Math.cos(angle) * radius;
    const yOffset = Math.sin(angle) * radius;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + xOffset,
        y: currentTransform.y + yOffset,
        rotation: currentTransform.rotation + (angle * 180 / Math.PI)
      },
      opacity: 1
    };
  }
};
