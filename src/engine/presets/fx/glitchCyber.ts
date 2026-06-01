import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const glitchCyber: PresetDefinition = {
  id: 'fx_glitchCyber',
  name: '赛博故障 (Cyber Glitch)',
  category: 'fx',
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 15, min: 0, max: 50, step: 1 },
    { key: 'color1', label: '主色', type: 'color', default: '#00ffff' },
    { key: 'color2', label: '副色', type: 'color', default: '#ff00ff' }
  ],
  apply: (progress, params, currentTransform) => {
    const intensity = Math.max(0, Math.min(50, params.intensity || 15));
    const color1 = params.color1 || '#00ffff';
    const color2 = params.color2 || '#ff00ff';
    const p = Math.max(0, Math.min(1, progress));

    const noise1 = perlinNoise1D(p, 18, 0) * 2 - 1;
    const noise2 = perlinNoise1D(p, 14, 77) * 2 - 1;
    const noise3 = perlinNoise1D(p, 10, 123) * 2 - 1;

    const offset1 = noise1 * intensity;
    const offset2 = noise2 * intensity;
    const skew = noise3 * intensity * 0.5;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + offset1,
        y: currentTransform.y + offset2
      },
      opacity: 1,
      filter: `drop-shadow(${intensity * 0.3}px 0 0 ${color1}) drop-shadow(-${intensity * 0.3}px 0 0 ${color2})`
    };
  }
};
