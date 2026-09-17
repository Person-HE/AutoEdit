import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, colorUtils, easing, drawUtils, hash } from '../templateUtils';

export const glitchTitleTemplate: TemplateDefinition = {
  id: 'text_glitch_title',
  name: '故障大标题',
  description: '赛博故障风格标题，带 RGB 分离、扫描错位、数据块闪烁',
  category: 'text',
  quality: 'viral',
  mood: ['tension', 'mysterious'],
  material: ['neon', 'carbon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'perlinNoise1D'],
  schema: [
    { key: 'text', label: '标题文字', type: 'string', default: '所有人觉得我完了' },
    { key: 'fontSize', label: '字号', type: 'number', default: 90, min: 40, max: 200, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#a855f7' },
    { key: 'intensity', label: '故障强度', type: 'number', default: 0.8, min: 0, max: 1, step: 0.05 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '所有人觉得我完了');
    const fontSize = paramGuard.number(params.fontSize, 90, 40, 200);
    const color = paramGuard.color(params.color, '#a855f7');
    const intensity = paramGuard.number(params.intensity, 0.8, 0, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const enter = easing.easeOutExpo(Math.min(1, p * 2));
    const flicker = Math.sin(time * 20) > 0.7 ? 1 : 0;
    const seed = Math.floor(time * 15);
    const shiftX = (Math.sin(seed * 4.1) * 12 + Math.cos(seed * 2.7) * 8) * intensity * (1 - p * 0.5);

    ctx.save();
    ctx.globalAlpha = enter;
    ctx.font = `900 ${fontSize}px "Microsoft YaHei", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 背景数据块（空间后景）
    ctx.save();
    ctx.globalAlpha = 0.08 * intensity;
    for (let i = 0; i < 12; i++) {
      const h = hash.float(seed + i);
      const bx = -width / 2 + h * width;
      const by = -height / 2 + hash.float(seed + i + 100) * height;
      ctx.fillStyle = i % 2 === 0 ? '#ff0055' : '#00f0ff';
      ctx.fillRect(bx + shiftX, by, 40 + h * 120, 3 + h * 10);
    }
    ctx.restore();

    // 主文字
    ctx.fillStyle = color;
    ctx.fillText(text, shiftX * 0.2, 0);

    // 多层阴影纵深
    for (let i = 5; i > 0; i--) {
      ctx.fillStyle = colorUtils.toRgba('#000000', 0.25 - i * 0.04);
      ctx.fillText(text, shiftX * 0.2 + i * 3, i * 4);
    }

    // RGB 分离
    if (intensity > 0.2 && p < 0.85) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,80,0.6)';
      ctx.fillText(text, shiftX * 0.2 + 8 * intensity + flicker * 4, 0);
      ctx.fillStyle = 'rgba(0,240,255,0.6)';
      ctx.fillText(text, shiftX * 0.2 - 8 * intensity - flicker * 4, 0);
    }

    // 随机切片错位
    if (intensity > 0.4 && p < 0.8) {
      ctx.globalCompositeOperation = 'source-over';
      const sliceCount = Math.floor(3 + intensity * 6);
      for (let i = 0; i < sliceCount; i++) {
        const sy = -fontSize / 2 + hash.float(seed + i * 13) * fontSize;
        const sh = 4 + hash.float(seed + i * 7) * 20;
        const sx = shiftX * (0.5 + hash.float(seed + i * 19));
        ctx.save();
        ctx.beginPath();
        ctx.rect(-width / 2, sy, width, sh);
        ctx.clip();
        ctx.fillStyle = color;
        ctx.fillText(text, sx, 0);
        ctx.restore();
      }
    }

    ctx.restore();
    drawUtils.scanlines(ctx, width, height, 4, 0.1);
  },
  initParams: () => ({
    text: '所有人觉得我完了',
    fontSize: 90,
    color: '#a855f7',
    intensity: 0.8,
  }),
};
