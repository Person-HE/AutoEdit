import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, easing } from '../templateUtils';

export const neonScanlinesTemplate: TemplateDefinition = {
  id: 'effect_neon_scanlines',
  name: '霓虹扫描线',
  description: '霓虹灯管式水平扫描线，带 RGB 色差和故障条纹',
  category: 'effect',
  quality: 'viral',
  mood: ['tension', 'mysterious'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['perlinNoise1D'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#ff00a0' },
    { key: 'secondaryColor', label: '辅色', type: 'color', default: '#00f0ff' },
    { key: 'density', label: '密度', type: 'number', default: 26, min: 8, max: 60, step: 2 },
    { key: 'speed', label: '速度', type: 'number', default: 1.4, min: 0.2, max: 3, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = params.color || '#ff00a0';
    const secondaryColor = params.secondaryColor || '#00f0ff';
    const density = Math.max(8, Math.min(60, params.density ?? 26));
    const speed = Math.max(0.2, Math.min(3, params.speed ?? 1.4));
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#050008';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const lineHeight = height / density;
    const offset = (time * speed * lineHeight) % lineHeight;

    ctx.save();
    for (let i = -1; i <= density + 1; i++) {
      const y = -height / 2 + i * lineHeight + offset;
      const progress = i / density;
      const alpha = (0.12 + 0.45 * Math.abs(Math.sin(progress * Math.PI + time * speed))) * p;
      const lineColor = progress > 0.5 ? color : secondaryColor;

      ctx.strokeStyle = lineColor;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-width / 2, y);
      ctx.lineTo(width / 2, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 故障垂直条纹
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const seed = i * 791;
      const x = ((seed * 47 + time * 35) % width) - width / 2;
      const w = 20 + (seed % 50);
      const shift = Math.sin(time * 8 + i) * 10;
      ctx.globalAlpha = (0.08 + 0.1 * Math.random()) * p;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,255,0.3)';
      ctx.fillRect(x + shift, -height / 2, w, height);
    }
    ctx.restore();
  },
  initParams: () => ({
    color: '#ff00a0',
    secondaryColor: '#00f0ff',
    density: 26,
    speed: 1.4,
  }),
};
