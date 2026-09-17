import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, colorUtils, easing, drawUtils } from '../templateUtils';

export const kineticTitleTemplate: TemplateDefinition = {
  id: 'text_kinetic_title',
  name: '动力字标题',
  description: '逐字以弹簧物理弹跳进入，带有字间距呼吸感与 3D 纵深',
  category: 'text',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'gravityBounce', 'inertiaDecay'],
  schema: [
    { key: 'text', label: '标题文字', type: 'string', default: '收入翻倍' },
    { key: 'fontSize', label: '字号', type: 'number', default: 120, min: 40, max: 220, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#f6e05e' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '收入翻倍');
    const fontSize = paramGuard.number(params.fontSize, 120, 40, 220);
    const color = paramGuard.color(params.color, '#f6e05e');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    ctx.save();
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
    ctx.textBaseline = 'middle';

    const chars = text.split('');
    const totalWidth = ctx.measureText(text).width;
    let x = -totalWidth / 2;

    chars.forEach((char, i) => {
      const stagger = Math.max(0, Math.min(1, (p * 1.4 - i * 0.08) / 0.6));
      const springY = easing.spring(stagger, 180, 12, 1) * (-fontSize * 0.6);
      const bounce = (1 - stagger) * Math.sin(stagger * Math.PI * 3) * fontSize * 0.1;
      const charW = ctx.measureText(char).width;

      // 3D 纵深偏移
      const depth = Math.sin(time * 2 + i) * 3;

      ctx.save();
      ctx.translate(x + charW / 2, springY + bounce + depth);
      ctx.scale(1 + springY * 0.0005, 1 + springY * 0.0005);

      // 主字
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.textAlign = 'center';
      ctx.fillText(char, 0, 0);
      ctx.shadowBlur = 0;

      // 金属高光
      ctx.globalCompositeOperation = 'source-atop';
      const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
      grad.addColorStop(0, 'rgba(255,255,255,0.8)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
      grad.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.fillText(char, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
      x += charW;
    });

    ctx.restore();
    drawUtils.vignette(ctx, width, height, 0.35);
  },
  initParams: () => ({
    text: '收入翻倍',
    fontSize: 120,
    color: '#f6e05e',
  }),
};
