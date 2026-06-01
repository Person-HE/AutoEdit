import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const lightRaysTemplate: TemplateDefinition = {
  id: 'vfx_light_rays',
  name: '光线',
  description: '体积光线效果，带有渐变和散射',
  category: 'effect',
  schema: [
    { key: 'color1', label: '光线颜色', type: 'color', default: '#ffd700' },
    { key: 'color2', label: '散射颜色', type: 'color', default: '#ff8c00' },
    { key: 'rayCount', label: '光线数量', type: 'number', default: 8, min: 4, max: 16, step: 1 },
    { key: 'rayLength', label: '光线长度', type: 'number', default: 300, min: 100, max: 500, step: 20 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#ffd700');
    const color2 = paramGuard.color(params.color2, '#ff8c00');
    const rayCount = paramGuard.number(params.rayCount, 8, 4, 16);
    const rayLength = paramGuard.number(params.rayLength, 300, 100, 500);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050508', '#0a0a10', '#050508'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const enterProgress = easing.easeOutCubic(Math.min(1, p / 0.5));
    const rotation = time * 0.1;

    drawUtils.multiLayerGlow(ctx, 0, 0, color1, 40, 5);
    drawUtils.particle(ctx, 0, 0, 15, '#ffffff', 0.8 * enterProgress, 0.9);

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + rotation;
      const rayWidth = 0.08 + Math.sin(time * 1.5 + i * 0.7) * 0.03;
      const currentLength = rayLength * enterProgress * (0.7 + Math.sin(time + i * 0.5) * 0.3);
      const rayAlpha = (0.3 + Math.sin(time * 2 + i) * 0.1) * enterProgress;
      const rayColor = colorUtils.lerpColor(color1, color2, i / rayCount);

      ctx.save();
      ctx.rotate(angle);

      const rayGrad = ctx.createLinearGradient(0, 0, currentLength, 0);
      rayGrad.addColorStop(0, colorUtils.toRgba(rayColor, rayAlpha * 0.8));
      rayGrad.addColorStop(0.3, colorUtils.toRgba(rayColor, rayAlpha * 0.5));
      rayGrad.addColorStop(0.7, colorUtils.toRgba(color2, rayAlpha * 0.2));
      rayGrad.addColorStop(1, colorUtils.toRgba(color2, 0));

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(currentLength, -currentLength * rayWidth);
      ctx.lineTo(currentLength, currentLength * rayWidth);
      ctx.closePath();
      ctx.fillStyle = rayGrad;
      ctx.fill();

      drawUtils.lightBeam(ctx, 0, 0, currentLength, 0, rayColor, rayAlpha * 0.3, 2);
      ctx.restore();
    }

    const dustCount = 20;
    for (let i = 0; i < dustCount; i++) {
      const seed = i * 2719;
      const dustAngle = ((seed * 7) % 10000) / 10000 * Math.PI * 2 + rotation;
      const dustDist = ((seed * 11) % 10000) / 10000 * rayLength * 0.6;
      const dx = Math.cos(dustAngle) * dustDist;
      const dy = Math.sin(dustAngle) * dustDist;
      const dustAlpha = 0.2 * enterProgress * (0.5 + Math.sin(time * 2 + i) * 0.5);
      drawUtils.particle(ctx, dx, dy, 2, color1, dustAlpha, 0.5);
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#ffd700',
    color2: '#ff8c00',
    rayCount: 8,
    rayLength: 300
  })
};
