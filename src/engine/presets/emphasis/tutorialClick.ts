import { PresetDefinition } from '../types';
import { snapSpring } from '../../utils/easing';

export const tutorialClick: PresetDefinition = {
  id: 'emphasis_tutorial_click',
  name: '演示-点击反馈 (Click Press)',
  category: 'emphasis',
  schema: [
    { key: 'strength', label: '按压深度', type: 'number', default: 0.05, min: 0.01, max: 0.2, step: 0.01 },
    { key: 'speed', label: '点击速度', type: 'number', default: 2, min: 1, max: 5, step: 0.5 }
  ],
  apply: (progress, params, currentTransform) => {
    const strength = Math.max(0.01, Math.min(0.2, params.strength || 0.05));
    const speed = Math.max(1, Math.min(5, params.speed || 2));
    const p = Math.max(0, Math.min(1, progress));

    const tension = 400 * speed;
    const friction = 30 + speed * 8;
    const springVal = snapSpring(p, tension, friction);

    const pressDepth = (1 - springVal) * strength * 2;
    const scaleDelta = 1 - pressDepth;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1
    };
  }
};
