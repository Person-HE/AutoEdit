import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const fireTemplate: TemplateDefinition = {
  id: 'bg_fire',
  name: '火焰',
  description: '真实火焰效果，带有余烬粒子和多层渐变',
  category: 'effect',
  schema: [
    { key: 'intensity', label: '火焰强度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 },
    { key: 'emberCount', label: '余烬数量', type: 'number', default: 30, min: 10, max: 60, step: 5 },
    { key: 'baseColor', label: '基础颜色', type: 'color', default: '#ff4500' }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const intensity = paramGuard.number(params.intensity, 1, 0.5, 2);
    const emberCount = paramGuard.number(params.emberCount, 30, 10, 60);
    const baseColor = paramGuard.color(params.baseColor, '#ff4500');
    const p = paramGuard.number(progress, 0, 0, 1);

    const bgGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, ['#0a0505', '#1a0a0a', '#0a0505'], 180);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    drawUtils.radialGlow(ctx, 0, height * 0.3, width * 0.4, baseColor, 0.1 * intensity);
    drawUtils.multiLayerGlow(ctx, 0, height * 0.3, baseColor, width * 0.15, 4);

    const flameColors = [
      ['#ff0000', '#ff4500', '#ff6600'],
      ['#ff4500', '#ff6600', '#ff8800'],
      ['#ff6600', '#ff8800', '#ffaa00'],
      ['#ff8800', '#ffaa00', '#ffcc00'],
      ['#ffaa00', '#ffcc00', '#ffee00']
    ];

    const flameCount = 7;
    for (let f = 0; f < flameCount; f++) {
      const flamePhase = time * 2 + f * 0.9;
      const flameX = (f - flameCount / 2) * width * 0.08 + Math.sin(flamePhase * 0.5) * 20;
      const flameBaseY = height * 0.35;
      const flameHeight = (height * 0.4 + Math.sin(flamePhase * 0.7) * height * 0.08) * intensity;
      const flameWidth = width * 0.06 + Math.sin(flamePhase * 0.3) * width * 0.02;
      const colors = flameColors[f % flameColors.length];

      ctx.save();
      const flameGrad = ctx.createLinearGradient(flameX, flameBaseY, flameX, flameBaseY - flameHeight);
      flameGrad.addColorStop(0, colorUtils.toRgba(colors[0], 0.7 * intensity));
      flameGrad.addColorStop(0.3, colorUtils.toRgba(colors[1], 0.5 * intensity));
      flameGrad.addColorStop(0.6, colorUtils.toRgba(colors[2], 0.3 * intensity));
      flameGrad.addColorStop(1, colorUtils.toRgba(colors[2], 0));

      ctx.beginPath();
      ctx.moveTo(flameX - flameWidth, flameBaseY);
      const tipSegments = 20;
      for (let i = 0; i <= tipSegments; i++) {
        const t = i / tipSegments;
        const y = flameBaseY - t * flameHeight;
        const taper = 1 - t;
        const wave = Math.sin(t * Math.PI * 3 + flamePhase) * flameWidth * taper * 0.4;
        const wave2 = Math.sin(t * Math.PI * 5 + flamePhase * 1.5) * flameWidth * taper * 0.2;
        const x = flameX + (wave + wave2) * taper;
        ctx.lineTo(x + flameWidth * taper * 0.5, y);
      }
      for (let i = tipSegments; i >= 0; i--) {
        const t = i / tipSegments;
        const y = flameBaseY - t * flameHeight;
        const taper = 1 - t;
        const wave = Math.sin(t * Math.PI * 3 + flamePhase + 1) * flameWidth * taper * 0.4;
        const wave2 = Math.sin(t * Math.PI * 5 + flamePhase * 1.5 + 1) * flameWidth * taper * 0.2;
        const x = flameX + (wave + wave2) * taper;
        ctx.lineTo(x - flameWidth * taper * 0.5, y);
      }
      ctx.closePath();
      ctx.fillStyle = flameGrad;
      ctx.fill();
      ctx.restore();

      drawUtils.radialGlow(ctx, flameX, flameBaseY - flameHeight * 0.3, flameWidth * 2, colors[1], 0.08 * intensity);
    }

    const coreGrad = ctx.createRadialGradient(0, height * 0.3, 0, 0, height * 0.3, width * 0.15);
    coreGrad.addColorStop(0, colorUtils.toRgba('#ffee00', 0.3 * intensity));
    coreGrad.addColorStop(0.3, colorUtils.toRgba('#ffaa00', 0.2 * intensity));
    coreGrad.addColorStop(0.6, colorUtils.toRgba('#ff6600', 0.1 * intensity));
    coreGrad.addColorStop(1, colorUtils.toRgba('#ff4500', 0));
    ctx.fillStyle = coreGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    for (let i = 0; i < emberCount; i++) {
      const seed = i * 3121;
      const emberPhase = time * 1.5 + i * 0.3;
      const ex = ((seed * 7) % 10000) / 10000 * width * 0.6 - width * 0.3 + Math.sin(emberPhase * 0.5) * 30;
      const riseProgress = ((emberPhase * 0.3 + ((seed * 11) % 100) / 100) % 1);
      const ey = height * 0.35 - riseProgress * height * 0.6;
      const emberSize = 1.5 + (1 - riseProgress) * 3;
      const emberAlpha = (1 - riseProgress) * 0.8 * intensity;
      const emberColor = i % 3 === 0 ? '#ffaa00' : i % 3 === 1 ? '#ff6600' : '#ff4500';

      drawUtils.particle(ctx, ex, ey, emberSize * 3, emberColor, emberAlpha * 0.3, 0.3);
      drawUtils.particle(ctx, ex, ey, emberSize, emberColor, emberAlpha, 0.7);
    }

    drawUtils.vignette(ctx, width, height, 0.4);
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.015, time);
  },

  initParams: () => ({
    intensity: 1,
    emberCount: 30,
    baseColor: '#ff4500'
  })
};
