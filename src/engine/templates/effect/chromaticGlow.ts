import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, easing } from '../templateUtils';

export const chromaticGlowTemplate: TemplateDefinition = {
  id: 'effect_chromatic_glow',
  name: 'RGB 色差辉光',
  description: '中心放射 RGB 色差光晕，模拟镜头光学色散与霓虹漏光',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'mysterious'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeOutExpo', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 0.7, min: 0, max: 1, step: 0.05 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const intensity = paramGuard.number(params.intensity, 0.7, 0, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const pulse = 1 + Math.sin(time * 3) * 0.1;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 红色通道
    const rGrad = ctx.createRadialGradient(-30 * intensity, 0, 0, 0, 0, width * 0.6 * pulse);
    rGrad.addColorStop(0, 'rgba(255, 0, 80, 0)');
    rGrad.addColorStop(0.5, `rgba(255, 0, 80, ${0.35 * intensity * p})`);
    rGrad.addColorStop(1, 'rgba(255, 0, 80, 0)');
    ctx.fillStyle = rGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 绿色通道
    const gGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.55 * pulse);
    gGrad.addColorStop(0, 'rgba(0, 255, 157, 0)');
    gGrad.addColorStop(0.5, `rgba(0, 255, 157, ${0.25 * intensity * p})`);
    gGrad.addColorStop(1, 'rgba(0, 255, 157, 0)');
    ctx.fillStyle = gGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 蓝色通道
    const bGrad = ctx.createRadialGradient(30 * intensity, 0, 0, 0, 0, width * 0.65 * pulse);
    bGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    bGrad.addColorStop(0.5, `rgba(0, 240, 255, ${0.35 * intensity * p})`);
    bGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = bGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    ctx.restore();

    // 水平光晕带
    const beamAlpha = 0.15 * intensity * p;
    ctx.fillStyle = `rgba(255, 255, 255, ${beamAlpha})`;
    ctx.fillRect(-width / 2, -height / 12, width, height / 6);
  },
  initParams: () => ({
    intensity: 0.7,
  }),
};
