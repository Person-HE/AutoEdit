import { PresetDefinition } from '../types';

export const flashSoft: PresetDefinition = {
  id: 'emphasis_flashSoft',
  name: '柔和闪烁 (Flash Soft)',
  category: 'emphasis',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 3, min: 1, max: 8, step: 1 },
    { key: 'minOpacity', label: '最小透明度', type: 'number', default: 0.5, min: 0.2, max: 0.9, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(1, Math.min(8, params.speed || 3));
    const minOpacity = Math.max(0.2, Math.min(0.9, params.minOpacity || 0.5));
    const p = Math.max(0, Math.min(1, progress));

    const decay = Math.exp(-p * speed * 1.5);
    const oscillation = (Math.sin(p * Math.PI * 2 * speed) + 1) / 2;
    const flashIntensity = decay * oscillation;

    const brightness = 1 + flashIntensity * 0.8;
    const opacity = minOpacity + (1 - minOpacity) * (0.5 + flashIntensity * 0.5);

    return {
      transform: {
        ...currentTransform
      },
      opacity: Math.max(minOpacity, Math.min(1, opacity)),
      filter: `brightness(${brightness.toFixed(2)})`
    };
  }
};
