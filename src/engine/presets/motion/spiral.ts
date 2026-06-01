import { PresetDefinition } from '../types';
import { spring, perlinNoise1D } from '../../utils/easing';

export const spiral: PresetDefinition = {
  id: 'motion_spiral',
  name: '螺旋 (Spiral)',
  category: 'motion',
  schema: [
    { key: 'radius', label: '最大半径', type: 'number', default: 100, min: 10, max: 300, step: 10 },
    { key: 'turns', label: '圈数', type: 'number', default: 2, min: 1, max: 5, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const radius = Math.max(10, Math.min(300, params.radius || 100));
    const turns = Math.max(1, Math.min(5, params.turns || 2));
    const p = Math.max(0, Math.min(1, progress));

    const radiusProgress = spring(p, 120, 14, 1);
    const noiseVariation = perlinNoise1D(p, turns * 2, 7) * 0.08;
    const angle = p * Math.PI * 2 * turns * (1 + noiseVariation);
    const currentRadius = radius * radiusProgress;
    const xOffset = Math.cos(angle) * currentRadius;
    const yOffset = Math.sin(angle) * currentRadius;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + xOffset,
        y: currentTransform.y + yOffset,
        rotation: currentTransform.rotation + (angle * 180 / Math.PI),
        scale: Math.max(0.001, currentTransform.scale)
      },
      opacity: 1
    };
  }
};
