import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const cyberSubtitleTemplate: TemplateDefinition = {
  id: 'text_cyber_subtitle',
  name: '赛博副标题',
  description: '终端风格副标题，带打字机效果、光标闪烁与代码行背景',
  category: 'text',
  quality: 'viral',
  mood: ['mysterious', 'calm'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation'],
  schema: [
    { key: 'text', label: '副标题文字', type: 'string', default: '这不是鸡汤，是普通人能复制的路径' },
    { key: 'fontSize', label: '字号', type: 'number', default: 56, min: 24, max: 120, step: 4 },
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '这不是鸡汤，是普通人能复制的路径');
    const fontSize = paramGuard.number(params.fontSize, 56, 24, 120);
    const color = paramGuard.color(params.color, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const typeProgress = Math.min(text.length, Math.floor(text.length * easing.easeOutExpo(p)));
    const displayText = text.slice(0, typeProgress);

    ctx.save();
    ctx.font = `600 ${fontSize}px "Microsoft YaHei", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 背景代码行
    const metrics = ctx.measureText(text);
    const pad = 40;
    const boxW = metrics.width + pad * 2;
    const boxH = fontSize + pad;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.globalAlpha = 1;

    // 文字 + 发光
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(displayText, 0, 0);
    ctx.shadowBlur = 0;

    // 光标
    if (p < 1 && Math.floor(time * 12) % 2 === 0) {
      const cursorX = -metrics.width / 2 + ctx.measureText(displayText).width + 4;
      ctx.fillStyle = color;
      ctx.fillRect(cursorX, -fontSize / 3, 3, fontSize * 0.7);
    }

    ctx.restore();
    drawUtils.scanlines(ctx, width, height, 4, 0.05);
  },
  initParams: () => ({
    text: '这不是鸡汤，是普通人能复制的路径',
    fontSize: 56,
    color: '#00f0ff',
  }),
};
