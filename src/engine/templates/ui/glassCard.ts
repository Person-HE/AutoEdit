import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, colorUtils, drawUtils, easing } from '../templateUtils';

export const glassCardTemplate: TemplateDefinition = {
  id: 'ui_glass_card',
  name: '玻璃卡片',
  description: '磨砂玻璃质感卡片，带折射高光、边缘辉光与弹性入场',
  category: 'ui',
  quality: 'viral',
  mood: ['calm', 'mysterious'],
  material: ['glass', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation'],
  schema: [
    { key: 'title', label: '标题', type: 'string', default: 'AI 收益概览' },
    { key: 'amount', label: '金额', type: 'string', default: '¥ 89,420.00' },
    { key: 'changeRate', label: '涨跌幅', type: 'string', default: '+28.5%' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const title = paramGuard.string(params.title, 'AI 收益概览');
    const amount = paramGuard.string(params.amount, '¥ 89,420.00');
    const changeRate = paramGuard.string(params.changeRate, '+28.5%');
    const accentColor = paramGuard.color(params.accentColor, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const cardW = 560;
    const cardH = 300;
    const radius = 24;

    // 弹性入场
    const scale = easing.spring(p, 160, 14, 1);
    const settle = p < 1 ? easing.dampedOscillation(p, 3, 0.2) * 0.02 * (1 - p) : 0;

    ctx.save();
    ctx.scale(scale + settle, scale + settle);

    // 背景辉光
    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, 160, 5);

    // 磨砂玻璃底
    drawUtils.roundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // 玻璃边框
    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 折射高光
    drawUtils.glassHighlight(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius, 0.25);

    // 标题
    ctx.font = '600 32px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(title, -cardW / 2 + 40, -cardH / 2 + 70);

    // 金额
    ctx.font = '900 72px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 20;
    ctx.fillText(amount, -cardW / 2 + 40, 10);
    ctx.shadowBlur = 0;

    // 涨跌幅标签
    const tagW = 140;
    const tagH = 44;
    const tagX = -cardW / 2 + 40;
    const tagY = 60;
    drawUtils.roundedRect(ctx, tagX, tagY, tagW, tagH, 8);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = accentColor;
    ctx.font = '700 24px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(changeRate, tagX + tagW / 2, tagY + tagH / 2);

    // 装饰数据条
    for (let i = 0; i < 4; i++) {
      const bw = 60 + Math.sin(time * 2 + i) * 20;
      const bx = 120 + i * 90;
      const by = -cardH / 2 + 120;
      ctx.fillStyle = colorUtils.toRgba(accentColor, 0.25);
      ctx.fillRect(bx, by, bw, 8);
    }

    ctx.restore();
  },
  initParams: () => ({
    title: 'AI 收益概览',
    amount: '¥ 89,420.00',
    changeRate: '+28.5%',
    accentColor: '#00f0ff',
  }),
};
