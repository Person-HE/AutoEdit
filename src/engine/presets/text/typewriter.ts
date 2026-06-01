import { PresetDefinition } from '../types';
import { perlinNoise1D } from '../../utils/easing';

export const typewriter: PresetDefinition = {
  id: 'text_typewriter',
  name: '打字机 (Typewriter)',
  category: 'text',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 1, min: 0.1, max: 3, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(0.1, Math.min(3, params.speed || 1));
    const p = Math.max(0, Math.min(1, progress));

    const rhythmNoise = perlinNoise1D(p, speed * 8, 0);
    const variableSpeed = speed * 10 * (0.7 + rhythmNoise * 0.6);
    const blink = Math.floor(p * variableSpeed) % 2 === 0 ? 1 : 0.7;

    return {
      transform: currentTransform,
      opacity: p < 1 ? blink : 1
    };
  }
};
