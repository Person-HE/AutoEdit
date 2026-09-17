import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing, hash } from '../templateUtils';

export const screenGlitchTemplate: TemplateDefinition = {
  id: 'effect_screen_glitch',
  name: '全屏故障',
  description: '全屏 RGB 分离、扫描线与数据块故障，用于高潮或转场冲击',
  category: 'effect',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['neon', 'carbon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['whipEffect', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '故障强度', type: 'number', default: 0.8, min: 0, max: 1, step: 0.05 },
    { key: 'scanlineCount', label: '扫描线密度', type: 'number', default: 45, min: 10, max: 100, step: 5 },
    { key: 'color', label: '主色调', type: 'color', default: '#ff0055' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const intensity = paramGuard.number(params.intensity, 0.8, 0, 1);
    const scanlineCount = paramGuard.number(params.scanlineCount, 45, 10, 100);
    const color = paramGuard.color(params.color, '#ff0055');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#050505';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 扫描线
    ctx.save();
    ctx.globalAlpha = 0.12 * intensity * p;
    ctx.fillStyle = '#ffffff';
    const lineHeight = height / scanlineCount;
    for (let i = 0; i < scanlineCount; i += 2) {
      const y = -height / 2 + i * lineHeight;
      ctx.fillRect(-width / 2, y, width, lineHeight * 0.6);
    }
    ctx.restore();

    // 随机 glitch 数据块
    const seed = Math.floor(time * 14);
    const blockCount = Math.floor(10 + intensity * 18);
    ctx.save();
    for (let i = 0; i < blockCount; i++) {
      const h = hash.float(seed + i * 13);
      const h2 = hash.float(seed + i * 7);
      const x = -width / 2 + h * width;
      const y = -height / 2 + h2 * height;
      const w = 40 + h * 140 * intensity;
      const hh = 5 + h2 * 24 * intensity;
      const channel = i % 3;
      ctx.fillStyle = channel === 0 ? 'rgba(255,0,80,0.75)' : channel === 1 ? 'rgba(0,240,255,0.65)' : 'rgba(255,255,255,0.55)';
      ctx.fillRect(x, y, w, hh);
    }
    ctx.restore();

    // RGB 分离横条
    ctx.save();
    const stripCount = Math.floor(6 + intensity * 12);
    for (let i = 0; i < stripCount; i++) {
      const h = hash.float(seed + i * 21);
      const y = -height / 2 + h * height;
      const hh = 10 + hash.float(seed + i * 17) * 50 * intensity;
      const shift = (hash.float(seed + i * 31) * 50 - 25) * intensity;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,80,0.4)';
      ctx.fillRect(-width / 2 + shift, y, width, hh);
      ctx.fillStyle = 'rgba(0,240,255,0.4)';
      ctx.fillRect(-width / 2 - shift, y, width, hh);
    }
    ctx.restore();

    // 中央高光脉冲
    const pulse = easing.easeOutExpo(1 - Math.abs(p - 0.5) * 2);
    drawUtils.radialGlow(ctx, 0, 0, width * 0.65 * pulse, color, 0.12 * intensity * p);

    // 噪点纹理
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.018, time);
  },
  initParams: () => ({
    intensity: 0.8,
    scanlineCount: 45,
    color: '#ff0055',
  }),
};
