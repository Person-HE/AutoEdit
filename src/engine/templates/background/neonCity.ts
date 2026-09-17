import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, colorUtils, easing, hash } from '../templateUtils';

export const neonCityTemplate: TemplateDefinition = {
  id: 'bg_neon_city',
  name: '霓虹都市',
  description: '赛博朋克城市天际线，三层纵深建筑、霓虹招牌、路面反射与雾气',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'mysterious'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['inertiaDecay', 'dampedOscillation'],
  schema: [
    { key: 'speed', label: '流动速度', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1 },
    { key: 'density', label: '建筑密度', type: 'number', default: 18, min: 8, max: 30, step: 1 },
    { key: 'color1', label: '霓虹色1', type: 'color', default: '#ff00cc' },
    { key: 'color2', label: '霓虹色2', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.2, 3);
    const density = paramGuard.number(params.density, 18, 8, 30);
    const color1 = paramGuard.color(params.color1, '#ff00cc');
    const color2 = paramGuard.color(params.color2, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    // 夜空背景
    const bgGrad = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    bgGrad.addColorStop(0, '#0a0014');
    bgGrad.addColorStop(0.5, '#120024');
    bgGrad.addColorStop(1, '#00101a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 远景模糊城市剪影（缓慢移动）
    ctx.save();
    ctx.globalAlpha = 0.3 * p;
    ctx.filter = 'blur(4px)';
    ctx.fillStyle = '#080018';
    const farOffset = (time * 8 * speed) % width;
    for (let i = -1; i <= density + 1; i++) {
      const h = hash.range(i * 3.7, 80, 260);
      const w = hash.range(i * 5.3, 30, 60);
      const x = -width / 2 + i * (width / density) - farOffset;
      ctx.fillRect(x, height / 2 - h, w, h);
    }
    ctx.filter = 'none';
    ctx.restore();

    // 中景建筑剪影
    ctx.save();
    ctx.globalAlpha = 0.7 * p;
    ctx.fillStyle = '#0d0020';
    const midOffset = (time * 18 * speed) % width;
    for (let i = -1; i <= density; i++) {
      const h = hash.range(i * 2.3 + 99, 120, 380);
      const w = hash.range(i * 4.1 + 17, 45, 80);
      const x = -width / 2 + i * (width / density) - midOffset;
      ctx.fillRect(x, height / 2 - h, w, h);

      // 窗户光点
      ctx.fillStyle = hash.float(i * 7) > 0.5 ? color1 : color2;
      ctx.globalAlpha = 0.35 * p;
      const rows = Math.floor(h / 28);
      const cols = Math.floor(w / 16);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (hash.float(i * 7 + r * 3 + c * 2) > 0.55) {
            ctx.fillRect(x + 5 + c * 13, height / 2 - h + 12 + r * 25, 5, 8);
          }
        }
      }
      ctx.globalAlpha = 0.7 * p;
      ctx.fillStyle = '#0d0020';
    }
    ctx.restore();

    // 霓虹招牌横条
    ctx.save();
    ctx.globalAlpha = 0.85 * p;
    const neonCount = 8;
    for (let i = 0; i < neonCount; i++) {
      const y = -height / 2 + 140 + i * 85 + Math.sin(i + time) * 25;
      const alpha = 0.5 + 0.35 * Math.sin(time * 2 + i);
      ctx.strokeStyle = i % 2 === 0 ? color1 : color2;
      ctx.lineWidth = 2 + (i % 3);
      ctx.globalAlpha = alpha * p;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      const segmentW = 70 + (i * 25);
      for (let x = -width / 2; x < width / 2; x += segmentW) {
        if ((x / segmentW + i) % 2 === 0) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + segmentW * 0.7, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 路面反射
    ctx.save();
    ctx.globalAlpha = 0.25 * p;
    const roadGrad = ctx.createLinearGradient(0, height / 2 - 90, 0, height / 2);
    roadGrad.addColorStop(0, colorUtils.toRgba(color1, 0));
    roadGrad.addColorStop(0.5, colorUtils.toRgba(color2, 0.45));
    roadGrad.addColorStop(1, colorUtils.toRgba(color1, 0));
    ctx.fillStyle = roadGrad;
    ctx.fillRect(-width / 2, height / 2 - 90, width, 90);
    ctx.restore();

    // 雾气光晕
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.radialGlow(ctx, 0, 0, width * 0.8, color1, 0.05 * p);
  },
  initParams: () => ({
    speed: 1,
    density: 18,
    color1: '#ff00cc',
    color2: '#00f0ff',
  }),
};
