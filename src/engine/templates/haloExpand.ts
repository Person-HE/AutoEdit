import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const haloExpandTemplate: TemplateDefinition = {
  id: 'vfx_halo_expand',
  name: '光环扩散',
  description: '带有光线射出的扩散光环效果',
  category: 'effect',
  schema: [
    { key: 'color1', label: '主颜色', type: 'color', default: '#ffd700' },
    { key: 'color2', label: '副颜色', type: 'color', default: '#ff8c00' },
    { key: 'maxRadius', label: '最大半径', type: 'number', default: 180, min: 80, max: 300, step: 10 },
    { key: 'rayCount', label: '光线数量', type: 'number', default: 12, min: 6, max: 24, step: 2 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#ffd700');
    const color2 = paramGuard.color(params.color2, '#ff8c00');
    const maxRadius = paramGuard.number(params.maxRadius, 180, 80, 300);
    const rayCount = paramGuard.number(params.rayCount, 12, 6, 24);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050508', '#0a0a10', '#050508'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const expandProgress = easing.easeOutCubic(p);
    const currentRadius = expandProgress * maxRadius;
    const haloAlpha = (1 - p * 0.7);

    const flashAlpha = Math.max(0, 1 - p * 3);
    if (flashAlpha > 0) {
      drawUtils.radialGlow(ctx, 0, 0, 40 * flashAlpha, '#ffffff', flashAlpha * 0.5);
    }

    drawUtils.multiLayerGlow(ctx, 0, 0, color1, currentRadius * 0.4, 5);
    drawUtils.radialGlow(ctx, 0, 0, currentRadius * 1.2, color1, 0.1 * haloAlpha);

    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = currentRadius * (0.85 + ring * 0.1);
      const ringAlpha = haloAlpha * (0.5 - ring * 0.12);
      const ringColor = colorUtils.lerpColor(color1, color2, ring / 3);
      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(ringColor, ringAlpha);
      ctx.lineWidth = 4 - ring;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    innerGrad.addColorStop(0, colorUtils.toRgba(color1, 0.15 * haloAlpha));
    innerGrad.addColorStop(0.5, colorUtils.toRgba(colorUtils.lerpColor(color1, color2, 0.5), 0.08 * haloAlpha));
    innerGrad.addColorStop(1, colorUtils.toRgba(color2, 0));
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + time * 0.2;
      const rayInnerR = currentRadius * 0.3;
      const rayOuterR = currentRadius * (0.8 + Math.sin(time * 2 + i) * 0.2);
      const rayAlpha = haloAlpha * (0.3 + Math.sin(time * 3 + i * 0.5) * 0.15);
      const rayColor = colorUtils.lerpColor(color1, color2, i / rayCount);

      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(rayColor, rayAlpha);
      ctx.lineWidth = 2;
      ctx.shadowColor = rayColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * rayInnerR, Math.sin(angle) * rayInnerR);
      ctx.lineTo(Math.cos(angle) * rayOuterR, Math.sin(angle) * rayOuterR);
      ctx.stroke();
      ctx.restore();

      drawUtils.particle(ctx, Math.cos(angle) * rayOuterR, Math.sin(angle) * rayOuterR, 4, rayColor, rayAlpha * 0.6, 0.5);
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#ffd700',
    color2: '#ff8c00',
    maxRadius: 180,
    rayCount: 12
  })
};
