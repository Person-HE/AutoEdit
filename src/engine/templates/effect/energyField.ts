import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const energyFieldTemplate: TemplateDefinition = {
  id: 'effect_energy_field',
  name: '能量场',
  description: '脉动能量场，带等离子体波纹、焦散光斑与电磁干扰',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['hologram', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'pulse'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#7b2ff7' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#7b2ff7');
    const accentColor = paramGuard.color(params.accentColor, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#030008';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const rings = 8;
    for (let i = 0; i < rings; i++) {
      const phase = time * 0.8 + i * 0.7;
      const radius = 80 + i * 65 + Math.sin(phase) * 20;
      const alpha = (0.4 - i * 0.04) * p;
      ctx.save();
      ctx.strokeStyle = i % 2 === 0 ? color : accentColor;
      ctx.lineWidth = 2 + Math.sin(phase) * 1;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 焦散光斑
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.3;
      const r = 120 + Math.sin(time + i) * 60;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      drawUtils.particle(ctx, x, y, 8 + Math.sin(time * 2 + i) * 3, accentColor, 0.5 * p, 0.7);
    }

    drawUtils.vignette(ctx, width, height, 0.45);
  },
  initParams: () => ({
    color: '#7b2ff7',
    accentColor: '#00f0ff',
  }),
};
