import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const tutorialFocus: PresetDefinition = {
  id: 'emphasis_tutorial_focus',
  name: '演示-聚焦高亮 (Focus Highlight)',
  category: 'emphasis',
  schema: [
    { key: 'scale', label: '缩放幅度', type: 'number', default: 0.1, min: 0.02, max: 0.3, step: 0.01 },
    { key: 'glow', label: '发光强度', type: 'number', default: 0.5, min: 0.1, max: 1, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const scaleAmount = Math.max(0.02, Math.min(0.3, params.scale || 0.1));
    const glow = Math.max(0.1, Math.min(1, params.glow || 0.5));
    const p = Math.max(0, Math.min(1, progress));

    const stiffness = 180;
    const damping = 14;
    const springVal = spring(p, stiffness, damping, 1);
    const scaleDelta = 1 + scaleAmount * (1 - springVal);

    const glowIntensity = (1 - springVal) * glow;
    const blurRadius = glowIntensity * 8;
    const glowOpacity = Math.max(0, glowIntensity * 0.7);

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * scaleDelta)
      },
      opacity: 1,
      filter: `drop-shadow(0 0 ${blurRadius.toFixed(1)}px rgba(64,128,255,${glowOpacity.toFixed(2)}))`
    };
  }
};
