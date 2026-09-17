import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const cyberTerminalTemplate: TemplateDefinition = {
  id: 'bg_cyber_terminal',
  name: '赛博终端 (CRT)',
  description: 'CRT 显示器效果：扫描线、荧光衰减、终端绿字、曲率暗角',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'tension'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#00ff9d' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#050a08' },
    { key: 'scanlineOpacity', label: '扫描线透明度', type: 'number', default: 0.25, min: 0, max: 1, step: 0.05 },
    { key: 'flicker', label: '闪烁强度', type: 'number', default: 0.08, min: 0, max: 0.5, step: 0.01 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const textColor = params.textColor || '#00ff9d';
    const bgColor = params.bgColor || '#050a08';
    const scanlineOpacity = Math.max(0, Math.min(1, params.scanlineOpacity ?? 0.25));
    const flicker = Math.max(0, Math.min(0.5, params.flicker ?? 0.08));
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = bgColor;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 径向渐变光晕
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.7);
    glow.addColorStop(0, 'rgba(0, 255, 157, 0.08)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 终端文字流
    ctx.save();
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    const lines = [
      '> system.boot --target=ai_core',
      '> loading neural weights... [OK]',
      '> optimize.income_stream --leverage=AI',
      '> execute.career_pivot --mode=aggressive',
      '> revenue.log: +¥52,000.00',
      '> status: INDEPENDENT',
      '> _',
    ];
    const lineHeight = 32;
    const startY = -height / 2 + 90;
    const offset = (time * 45) % lineHeight;
    for (let i = 0; i < 22; i++) {
      const y = startY + i * lineHeight - offset;
      if (y < -height / 2 || y > height / 2) continue;
      const line = lines[(i + Math.floor(time)) % lines.length];
      const alpha = (0.2 + 0.45 * (1 - Math.abs(y) / (height / 2))) * p;
      ctx.fillStyle = `rgba(0, 255, 157, ${alpha})`;
      ctx.fillText(line, -width / 2 + 70, y);
    }
    ctx.restore();

    // 扫描线
    drawUtils.scanlines(ctx, width, height, 4, scanlineOpacity);

    // 移动扫描光束
    const beamY = -height / 2 + (time * 140) % height;
    const beamGrad = ctx.createLinearGradient(0, beamY - 50, 0, beamY + 50);
    beamGrad.addColorStop(0, 'rgba(0, 255, 157, 0)');
    beamGrad.addColorStop(0.5, `rgba(0, 255, 157, ${0.25 + flicker})`);
    beamGrad.addColorStop(1, 'rgba(0, 255, 157, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-width / 2, beamY - 50, width, 100);

    // CRT 曲率暗角
    const vignette = ctx.createRadialGradient(0, 0, width * 0.3, 0, 0, width * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.8, 'rgba(0,0,0,0.35)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 闪烁
    ctx.fillStyle = `rgba(0, 255, 157, ${(Math.random() - 0.5) * flicker})`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  },
  initParams: () => ({
    textColor: '#00ff9d',
    bgColor: '#050a08',
    scanlineOpacity: 0.25,
    flicker: 0.08,
  }),
};
