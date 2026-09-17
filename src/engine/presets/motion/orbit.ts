import { PresetDefinition } from '../types';
import { dampedOscillation } from '../../utils/easing';

export const orbit: PresetDefinition = {
  id: 'motion_orbit',
  name: '3D 环绕 (3D Orbit)',
  description: '在三维空间中环绕运动',
  category: 'motion',
  quality: 'viral',
  mood: 'mysterious',
  material: 'hologram',
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'radius', label: '半径', type: 'number', default: 120, min: 0, max: 500 },
    { key: 'speed', label: '速度', type: 'number', default: 1, min: -3, max: 3, step: 0.1 },
  ],
  apply: (progress, params, currentTransform) => {
    const radius = Math.max(0, Math.min(500, params.radius || 120));
    const speed = Math.max(-3, Math.min(3, params.speed || 1));
    const t = Math.max(0, Math.min(1, progress));

    const angle = t * Math.PI * 2 * speed;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.35;
    const rotateY = Math.sin(angle) * 25;

    return {
      transform: {
        ...currentTransform,
        x: currentTransform.x + x,
        y: currentTransform.y + y,
        rotateY: (currentTransform.rotateY || 0) + rotateY,
      },
      opacity: 1,
      filter: 'drop-shadow(0 0 15px rgba(0,240,255,0.4))'
    };
  }
};
