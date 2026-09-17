import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const hologramFrameTemplate: TemplateDefinition = {
  id: 'ui_hologram_frame',
  name: '全息边框',
  description: '全息投影风格边框，带扫描光、透视网格与抖动残影',
  category: 'ui',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['hologram', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'perlinNoise1D'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'content', label: '内容文字', type: 'string', default: 'STATUS: INDEPENDENT' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00f0ff');
    const content = paramGuard.string(params.content, 'STATUS: INDEPENDENT');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const frameW = 720;
    const frameH = 420;
    const enter = easing.easeOutExpo(p);

    ctx.save();
    ctx.globalAlpha = enter;

    // 全息抖动
    const jitter = Math.sin(time * 30) * 1.5;
    ctx.translate(jitter, jitter * 0.5);

    // 角标
    const corner = 40;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    const drawCorner = (x: number, y: number, dx: number, dy: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * corner);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * corner, y);
      ctx.stroke();
    };
    drawCorner(-frameW / 2, -frameH / 2, 1, 1);
    drawCorner(frameW / 2, -frameH / 2, -1, 1);
    drawCorner(-frameW / 2, frameH / 2, 1, -1);
    drawCorner(frameW / 2, frameH / 2, -1, -1);
    ctx.shadowBlur = 0;

    // 扫描光束
    const scanY = -frameH / 2 + (time * 120) % frameH;
    const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    scanGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    scanGrad.addColorStop(0.5, color.replace('#', 'rgba(') + ',0.3)'.replace(')', ''));
    scanGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(-frameW / 2, scanY - 30, frameW, 60);

    // 内容文字
    ctx.font = '700 42px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillText(content, 0, 0);
    ctx.shadowBlur = 0;

    // 全息残影
    ctx.globalAlpha = 0.15 * enter;
    ctx.fillStyle = '#ff00a0';
    ctx.fillText(content, 4, 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(content, -4, -2);

    ctx.restore();
  },
  initParams: () => ({
    color: '#00f0ff',
    content: 'STATUS: INDEPENDENT',
  }),
};
