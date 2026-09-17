import { PresetDefinition } from '../types';
import { dampedOscillation, perlinNoise1D } from '../../utils/easing';

export const parallaxFloat: PresetDefinition = {
  id: 'motion_parallax_float',
  name: '视差漂浮 (Parallax Float)',
  category: 'motion',
  schema: [
    { key: 'amplitudeX', label: 'X轴幅度', type: 'number', default: 30, min: 0, max: 200, step: 5 },
    { key: 'amplitudeY', label: 'Y轴幅度', type: 'number', default: 20, min: 0, max: 200, step: 5 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1 },
    { key: 'depth', label: '深度系数', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const ampX = Math.max(0, Math.min(200, params.amplitudeX || 30));
    const ampY = Math.max(0, Math.min(200, params.amplitudeY || 20));
    const speed = Math.max(0.2, Math.min(3, params.speed || 1));
    const depth = Math.max(0.1, Math.min(3, params.depth || 1));
    const t = Math.max(0, Math.min(1, progress));

    const phase = t * speed;
    const driftX = Math.sin(phase * Math.PI * 2) * ampX * depth;
    const driftY = Math.cos(phase * Math.PI * 1.7) * ampY * depth;
    const rotate = dampedOscillation(phase, 0.5, 0.1) * 2 * depth;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + driftX,
        y: currentTransform.y + driftY,
        rotation: currentTransform.rotation + rotate
      },
      opacity: 1
    };
  }
};
