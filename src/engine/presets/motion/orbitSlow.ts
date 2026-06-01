import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const orbitSlow: PresetDefinition = {
  id: 'motion_orbitSlow',
  name: '慢速轨道 (OrbitSlow)',
  category: 'motion',
  schema: [
    { key: 'radius', label: '半径', type: 'number', default: 80, min: 10, max: 300, step: 10 },
    { key: 'speed', label: '速度', type: 'number', default: 0.5, min: 0.1, max: 2, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const radius = Math.max(10, Math.min(300, params.radius || 80));
    const speed = Math.max(0.1, Math.min(2, params.speed || 0.5));
    const p = Math.max(0, Math.min(1, progress));

    const speedVariation = 1 + perlinNoise1D(p, speed * 2, 0) * 0.1;
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
