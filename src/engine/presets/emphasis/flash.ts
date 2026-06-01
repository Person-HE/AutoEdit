import { PresetDefinition } from '../types';

export const flash: PresetDefinition = {
  id: 'emphasis_flash',
  name: '闪烁 (Flash)',
  category: 'emphasis',
  schema: [
    { key: 'speed', label: '速度', type: 'number', default: 4, min: 1, max: 10, step: 1 },
    { key: 'minOpacity', label: '最小透明度', type: 'number', default: 0.3, min: 0, max: 0.8, step: 0.1 }
  ],
  apply: (progress, params, currentTransform) => {
    const speed = Math.max(1, Math.min(10, params.speed || 4));
    const minOpacity = Math.max(0, Math.min(0.8, params.minOpacity || 0.3));
    const p = Math.max(0, Math.min(1, progress));

    const spikeDecay = Math.exp(-p * speed * 2.5);
    const oscillation = Math.abs(Math.sin(p * Math.PI * speed));
    const flashIntensity = spikeDecay * oscillation;

    const brightness = 1 + flashIntensity * 2;
    const opacity = minOpacity + (1 - minOpacity) * (1 - flashIntensity * 0.5);

    return {
      transform: {
        ...currentTransform
      },
      opacity: Math.max(minOpacity, Math.min(1, opacity)),
      filter: `brightness(${brightness.toFixed(2)})`
    };
  }
};
