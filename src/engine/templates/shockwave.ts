import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const shockwaveTemplate: TemplateDefinition = {
  id: 'vfx_shockwave',
  name: '冲击波',
  description: '多层环形冲击波，带有发光和渐变效果',
  category: 'effect',
  schema: [
    { key: 'color1', label: '内圈颜色', type: 'color', default: '#00d4ff' },
    { key: 'color2', label: '外圈颜色', type: 'color', default: '#ff00e5' },
    { key: 'ringCount', label: '环数', type: 'number', default: 4, min: 2, max: 8, step: 1 },
    { key: 'maxRadius', label: '最大半径', type: 'number', default: 200, min: 100, max: 400, step: 20 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const color2 = paramGuard.color(params.color2, '#ff00e5');
    const ringCount = paramGuard.number(params.ringCount, 4, 2, 8);
    const maxRadius = paramGuard.number(params.maxRadius, 200, 100, 400);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const flashAlpha = Math.max(0, 1 - p * 4);
    if (flashAlpha > 0) {
      drawUtils.radialGlow(ctx, 0, 0, 50 * flashAlpha, '#ffffff', flashAlpha * 0.6);
      drawUtils.multiLayerGlow(ctx, 0, 0, color1, 30 * flashAlpha, 5);
    }

    for (let ring = 0; ring < ringCount; ring++) {
      const ringDelay = ring * 0.08;
      const ringP = Math.max(0, Math.min(1, (p - ringDelay) / (1 - ringDelay)));
      if (ringP <= 0) continue;

      const ringProgress = easing.easeOutCubic(ringP);
      const radius = ringProgress * maxRadius;
      const ringAlpha = (1 - ringP) * 0.6;
      const ringColor = colorUtils.lerpColor(color1, color2, ring / ringCount);

      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(ringColor, ringAlpha);
      ctx.lineWidth = 3 - ring * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      drawUtils.radialGlow(ctx, 0, 0, radius, ringColor, ringAlpha * 0.15);

      const particleCount = 12;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + ring * 0.5;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        const particleAlpha = ringAlpha * 0.5;
        drawUtils.particle(ctx, px, py, 4, ringColor, particleAlpha, 0.5);
      }
    }

    const distortionAlpha = Math.max(0, 1 - p * 2);
    if (distortionAlpha > 0) {
      const distortRadius = easing.easeOutCubic(p) * maxRadius * 0.5;
      const distortGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, distortRadius);
      distortGrad.addColorStop(0, colorUtils.toRgba('#ffffff', distortionAlpha * 0.1));
      distortGrad.addColorStop(0.5, colorUtils.toRgba(color1, distortionAlpha * 0.05));
      distortGrad.addColorStop(1, colorUtils.toRgba(color1, 0));
      ctx.fillStyle = distortGrad;
      ctx.beginPath();
      ctx.arc(0, 0, distortRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    color2: '#ff00e5',
    ringCount: 4,
    maxRadius: 200
  })
};
