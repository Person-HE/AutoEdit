import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, colorUtils, easing, drawUtils, hash } from '../templateUtils';

export const countUpFireTemplate: TemplateDefinition = {
  id: 'text_countup_fire',
  name: '数字燃烧增长',
  description: '大额数字弹簧增长，带火焰色渐变、粒子尾迹与金属质感',
  category: 'text',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['metal', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'gravityBounce', 'inertiaDecay'],
  schema: [
    { key: 'value', label: '目标数值', type: 'number', default: 52000 },
    { key: 'prefix', label: '前缀', type: 'string', default: '+¥' },
    { key: 'fontSize', label: '字号', type: 'number', default: 180, min: 60, max: 300, step: 10 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const value = paramGuard.number(params.value, 52000, 0, 10000000);
    const prefix = paramGuard.string(params.prefix, '+¥');
    const fontSize = paramGuard.number(params.fontSize, 180, 60, 300);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const current = Math.floor(value * easing.spring(Math.min(1, p * 1.2), 140, 14, 1));
    const text = `${prefix}${current.toLocaleString()}`;

    ctx.save();
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 数字跳动回弹
    const bounce = p < 1 ? Math.sin(p * Math.PI * 4) * fontSize * 0.03 * (1 - p) : 0;
    const scale = 1 + bounce * 0.01;
    ctx.translate(0, bounce);
    ctx.scale(scale, scale);

    // 渐变文字
    const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(0.4, '#ff6600');
    grad.addColorStop(0.8, '#ff1a1a');
    grad.addColorStop(1, '#ffffff');

    // 发光阴影
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 40 + 20 * Math.sin(time * 6);
    ctx.fillStyle = grad;
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;

    // 金属高光
    ctx.globalCompositeOperation = 'source-atop';
    const shine = ctx.createLinearGradient(0, -fontSize / 2, 0, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0.9)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillText(text, 0, 0);

    ctx.restore();

    // 漂浮火星粒子
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const seed = i * 97;
      const px = (hash.float(seed + time) - 0.5) * width * 0.6;
      const py = height / 2 - (hash.float(seed + time * 0.5) * height * 0.4);
      const size = 2 + hash.float(seed) * 4;
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * 4 + i);
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
  initParams: () => ({
    value: 52000,
    prefix: '+¥',
    fontSize: 180,
  }),
};
