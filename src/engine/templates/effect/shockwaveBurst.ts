import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const shockwaveBurstTemplate: TemplateDefinition = {
  id: 'effect_shockwave_burst',
  name: '冲击波爆裂',
  description: '多层冲击波从中心爆裂扩散，带弹性衰减与辉光残影',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['neon', 'hologram'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'ringCount', label: '环数', type: 'number', default: 5, min: 2, max: 10, step: 1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00f0ff');
    const ringCount = paramGuard.number(params.ringCount, 5, 2, 10);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const maxR = Math.max(width, height) * 0.75;

    for (let i = 0; i < ringCount; i++) {
      const delay = i * 0.08;
      const localP = Math.max(0, Math.min(1, (p - delay) / (1 - delay)));
      const radius = maxR * easing.easeOutExpo(localP);
      const alpha = (1 - localP) * (0.7 - i * 0.08);
      const lineWidth = 8 * (1 - localP) + 1;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = alpha * p;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 中心核心辉光
    drawUtils.radialGlow(ctx, 0, 0, width * 0.35, color, 0.5 * p);
  },
  initParams: () => ({
    color: '#00f0ff',
    ringCount: 5,
  }),
};
