import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const scanline: PresetDefinition = {
  id: 'fx_scanline',
  name: '扫描线效果 (Scanline)',
  category: 'fx',
  schema: [
    { key: 'opacity', label: '线条透明度', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05 },
    { key: 'spacing', label: '线条间距', type: 'number', default: 4, min: 2, max: 10, step: 1 },
    { key: 'animate', label: '动态扫描', type: 'boolean', default: true }
  ],
  apply: (progress, params, currentTransform) => {
    const opacity = Math.max(0, Math.min(1, params.opacity || 0.3));
    const spacing = Math.max(2, Math.min(10, params.spacing || 4));
    const animate = params.animate !== false;
    const p = Math.max(0, Math.min(1, progress));

    const noiseVariation = perlinNoise1D(p, 3, 0) * 0.05;
    const scanOffset = animate
      ? p * 100 + noiseVariation * 20
      : 0;

    return {
      transform: currentTransform,
      opacity: 1,
      filter: `contrast(1.1) brightness(0.95)`,
      backgroundImage: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent ${spacing - 1}px,
        rgba(0, 0, 0, ${opacity}) ${spacing - 1}px,
        rgba(0, 0, 0, ${opacity}) ${spacing}px
      )`,
      backgroundPosition: `0 ${scanOffset}%`
    };
  }
};
