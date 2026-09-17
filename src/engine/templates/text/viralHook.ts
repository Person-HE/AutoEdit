import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, colorUtils, easing, hash } from '../templateUtils';

export const viralHookTemplate: TemplateDefinition = {
  id: 'text_viral_hook',
  name: '爆款钩子标题',
  description: '高冲击力大字标题，带 3D 厚重投影、金属质感、RGB 色差与 CRT 扫描线',
  category: 'text',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['metal', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'whipEffect'],
  schema: [
    { key: 'text', label: '标题文字', type: 'string', default: '被裁那天' },
    { key: 'fontSize', label: '字号', type: 'number', default: 160, min: 60, max: 320, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#ff0055' },
    { key: 'glitch', label: '故障强度', type: 'number', default: 0.6, min: 0, max: 1, step: 0.05 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '爆款钩子');
    const fontSize = paramGuard.number(params.fontSize, 160, 60, 320);
    const color = paramGuard.color(params.color, '#ff0055');
    const glitch = paramGuard.number(params.glitch, 0.6, 0, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    // 弹性缩放 + 阻尼 settle
    const springP = easing.spring(p, 160, 14, 1);
    const settle = p < 1 ? easing.dampedOscillation(p, 4, 0.25) * 0.015 * (1 - p) : 0;
    const scale = springP + settle;

    // 故障抖动偏移（带鞭子感）
    const seed = Math.floor(time * 18);
    const whip = p < 0.55 ? easing.whipEffect(p, 0.55) : 0;
    const gShift = glitch > 0
      ? (Math.sin(seed * 3.7) * 10 + Math.cos(seed * 2.1) * 8) * glitch * (1 - whip)
      : 0;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 3D 厚重投影层（空间深度）
    const layers = 10;
    for (let i = layers; i > 0; i--) {
      const alpha = 0.4 - i * 0.03;
      ctx.fillStyle = colorUtils.toRgba('#000000', alpha);
      ctx.fillText(text, gShift * 0.3 + i * 4, i * 5);
    }

    // 主文字 + 金属拉丝叠加
    ctx.fillStyle = color;
    ctx.fillText(text, gShift * 0.3, 0);

    // 内高光（模拟金属反光）
    ctx.globalCompositeOperation = 'source-atop';
    const metalGrad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    metalGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    metalGrad.addColorStop(0.25, 'rgba(255,255,255,0.15)');
    metalGrad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
    metalGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = metalGrad;
    ctx.fillText(text, gShift * 0.3, 0);

    ctx.globalCompositeOperation = 'source-over';

    // 霓虹外发光
    ctx.shadowColor = color;
    ctx.shadowBlur = 30 + 20 * Math.sin(time * 5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = colorUtils.toRgba('#ffffff', 0.7);
    ctx.strokeText(text, gShift * 0.3, 0);
    ctx.shadowBlur = 0;

    // RGB 分离残影
    if (glitch > 0 && p < 0.75) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,80,0.55)';
      ctx.fillText(text, gShift * 0.3 + 6 * glitch, 0);
      ctx.fillStyle = 'rgba(0,240,255,0.55)';
      ctx.fillText(text, gShift * 0.3 - 6 * glitch, 0);
    }

    ctx.restore();

    // 前景 CRT 扫描线
    drawUtils.scanlines(ctx, width, height, 3, 0.08);
  },
  initParams: () => ({
    text: '被裁那天',
    fontSize: 160,
    color: '#ff0055',
    glitch: 0.6,
  }),
};
