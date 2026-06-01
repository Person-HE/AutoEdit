import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const smokeTemplate: TemplateDefinition = {
  id: 'bg_smoke',
  name: '烟雾',
  description: '体积烟雾效果，带有光散射和层次感',
  category: 'effect',
  schema: [
    { key: 'speed', label: '烟雾速度', type: 'number', default: 0.8, min: 0.3, max: 2, step: 0.1 },
    { key: 'density', label: '烟雾密度', type: 'number', default: 0.7, min: 0.3, max: 1.5, step: 0.1 },
    { key: 'lightColor', label: '光源颜色', type: 'color', default: '#ff6b35' }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 0.8, 0.3, 2);
    const density = paramGuard.number(params.density, 0.7, 0.3, 1.5);
    const lightColor = paramGuard.color(params.lightColor, '#ff6b35');
    const p = paramGuard.number(progress, 0, 0, 1);

    const bgGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, ['#0a0a0f', '#0f0f18', '#0a0a12'], 135);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    drawUtils.radialGlow(ctx, 0, height * 0.3, width * 0.5, lightColor, 0.08);
    drawUtils.multiLayerGlow(ctx, 0, height * 0.3, lightColor, width * 0.2, 4);

    const smokeColors = ['#2a2a35', '#3a3a45', '#4a4a55', '#353540', '#404050'];
    const layerCount = 8;

    for (let layer = 0; layer < layerCount; layer++) {
      const layerPhase = time * speed * 0.15 + layer * 0.7;
      const baseY = height * 0.1 - layer * height * 0.08;
      const smokeColor = smokeColors[layer % smokeColors.length];
      const layerAlpha = density * (0.15 - layer * 0.01);

      ctx.save();
      ctx.globalAlpha = layerAlpha;

      const smokeGrad = ctx.createLinearGradient(0, baseY - height * 0.2, 0, baseY + height * 0.3);
      smokeGrad.addColorStop(0, colorUtils.toRgba(smokeColor, 0));
      smokeGrad.addColorStop(0.2, colorUtils.toRgba(smokeColor, 0.4));
      smokeGrad.addColorStop(0.5, colorUtils.toRgba(colorUtils.lerpColor(smokeColor, lightColor, 0.1), 0.6));
      smokeGrad.addColorStop(0.8, colorUtils.toRgba(smokeColor, 0.3));
      smokeGrad.addColorStop(1, colorUtils.toRgba(smokeColor, 0));

      ctx.beginPath();
      ctx.moveTo(-width / 2, baseY + height * 0.3);
      const segments = 30;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = -width / 2 + t * width;
        const wave1 = Math.sin(t * Math.PI * 2 + layerPhase) * 40;
        const wave2 = Math.sin(t * Math.PI * 3 + layerPhase * 1.3) * 25;
        const wave3 = Math.sin(t * Math.PI * 5 + layerPhase * 0.7) * 15;
        const y = baseY + wave1 + wave2 + wave3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width / 2, baseY + height * 0.3);
      ctx.closePath();
      ctx.fillStyle = smokeGrad;
      ctx.fill();
      ctx.restore();
    }

    const puffCount = 15;
    for (let i = 0; i < puffCount; i++) {
      const seed = i * 2719;
      const puffPhase = time * speed * 0.2 + i * 0.6;
      const px = ((seed * 7) % 10000) / 10000 * width - width / 2 + Math.sin(puffPhase) * 40;
      const py = height * 0.2 - ((seed * 11) % 10000) / 10000 * height * 0.5 - Math.abs(puffPhase % 3) * 20;
      const puffSize = 30 + ((seed * 13) % 50) + Math.sin(puffPhase * 0.5) * 15;
      const puffAlpha = density * 0.08 * (0.5 + Math.sin(puffPhase * 0.3) * 0.3);
      const puffColor = colorUtils.lerpColor('#3a3a45', lightColor, 0.15);

      drawUtils.particle(ctx, px, py, puffSize, puffColor, puffAlpha, 0.3);
      drawUtils.radialGlow(ctx, px, py, puffSize * 1.5, puffColor, puffAlpha * 0.5);
    }

    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.018, time);
  },

  initParams: () => ({
    speed: 0.8,
    density: 0.7,
    lightColor: '#ff6b35'
  })
};
