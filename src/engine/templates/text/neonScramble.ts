import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing, hash } from '../templateUtils';

export const neonScrambleTemplate: TemplateDefinition = {
  id: 'text_neon_scramble',
  name: '霓虹乱码解码',
  description: '从随机字符解码为目标文字，伴随霓虹发光与 CRT 闪烁',
  category: 'text',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation'],
  schema: [
    { key: 'text', label: '目标文字', type: 'string', default: 'INDEPENDENT' },
    { key: 'fontSize', label: '字号', type: 'number', default: 100, min: 40, max: 200, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#00ff9d' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, 'INDEPENDENT');
    const fontSize = paramGuard.number(params.fontSize, 100, 40, 200);
    const color = paramGuard.color(params.color, '#00ff9d');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const displayText = text.split('').map((c, i) => {
      const charP = Math.max(0, Math.min(1, (p * 1.3 - i * 0.05) / 0.7));
      const settled = easing.spring(charP, 160, 12, 1);
      if (settled > 0.98) return c;
      return chars[Math.floor(hash.float(Math.floor(time * 20) + i) * chars.length)];
    }).join('');

    ctx.save();
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 霓虹多层发光
    ctx.shadowColor = color;
    ctx.shadowBlur = 50;
    ctx.fillStyle = color;
    ctx.fillText(displayText, 0, 0);

    ctx.shadowBlur = 100;
    ctx.globalAlpha = 0.5;
    ctx.fillText(displayText, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // 内部高亮
    ctx.globalCompositeOperation = 'source-atop';
    const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillText(displayText, 0, 0);

    ctx.restore();
    drawUtils.scanlines(ctx, width, height, 3, 0.06);
  },
  initParams: () => ({
    text: 'INDEPENDENT',
    fontSize: 100,
    color: '#00ff9d',
  }),
};
