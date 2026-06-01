import { PresetDefinition } from '../types';
import { spring } from '../../utils/easing';

export const tutorialFocus: PresetDefinition = {
  id: 'motion_tutorial_focus',
  name: '演示-聚焦推拉 (Focus Zoom)',
  category: 'motion',
  schema: [
    { key: 'zoomLevel', label: '放大倍数', type: 'number', default: 1.2, min: 1, max: 2, step: 0.1 },
    { key: 'targetX', label: '中心X偏移', type: 'number', default: 0, min: -500, max: 500, step: 10 },
    { key: 'targetY', label: '中心Y偏移', type: 'number', default: 0, min: -500, max: 500, step: 10 }
  ],
  apply: (progress, params, currentTransform) => {
    const zoomEnd = Math.max(1, Math.min(2, params.zoomLevel || 1.2));
    const targetX = Math.max(-500, Math.min(500, params.targetX || 0));
    const targetY = Math.max(-500, Math.min(500, params.targetY || 0));
    const p = Math.max(0, Math.min(1, progress));

    const eased = spring(p, 180, 20, 1);

    const currentScaleMulti = 1 + (zoomEnd - 1) * eased;
    const currentOffsetX = targetX * eased;
    const currentOffsetY = targetY * eased;

    return {
      transform: {
        ...currentTransform,
        scale: Math.max(0.001, currentTransform.scale * currentScaleMulti),
        x: currentTransform.x + currentOffsetX,
        y: currentTransform.y + currentOffsetY
      },
      opacity: 1
    };
  }
};
