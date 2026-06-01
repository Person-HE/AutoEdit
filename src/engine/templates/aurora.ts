import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const auroraTemplate: TemplateDefinition = {
  id: 'bg_aurora',
  name: '极光',
  description: '真实的北极光效果，带有流动的渐变色带和网格渐变背景',
  category: 'effect',
  schema: [
    { key: 'speed', label: '流动速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 },
    { key: 'intensity', label: '亮度', type: 'number', default: 0.8, min: 0.3, max: 1.5, step: 0.1 },
    { key: 'bandCount', label: '色带数量', type: 'number', default: 5, min: 2, max: 8, step: 1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const intensity = paramGuard.number(params.intensity, 0.8, 0.3, 1.5);
    const bandCount = paramGuard.number(params.bandCount, 5, 2, 8);
    const p = paramGuard.number(progress, 0, 0, 1);

    const aurora = palettes.aurora;

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050520', '#0a0a2e', '#0f0f3a'], time * 0.05, 0.3);
    drawUtils.vignette(ctx, width, height, 0.3);

    const starCount = 60;
    for (let i = 0; i < starCount; i++) {
      const seed = i * 7919;
      const sx = ((seed * 13) % 10000) / 10000 * width - width / 2;
      const sy = ((seed * 17) % 10000) / 10000 * height * 0.5 - height / 4;
      const twinkle = Math.sin(time * 2 + i * 0.7) * 0.5 + 0.5;
      const starSize = 1 + twinkle * 1.5;
      drawUtils.particle(ctx, sx, sy, starSize, '#ffffff', twinkle * 0.6 * intensity, 0.8);
    }

    for (let band = 0; band < bandCount; band++) {
      const bandPhase = time * speed * 0.3 + band * 1.2;
      const bandY = -height * 0.15 + band * height * 0.08;
      const bandHeight = height * 0.2 + Math.sin(bandPhase * 0.5) * height * 0.05;
      const colorIndex = band % aurora.length;
      const bandColor = aurora[colorIndex];
      const nextColor = aurora[(colorIndex + 1) % aurora.length];

      ctx.save();
      ctx.globalAlpha = intensity * (0.3 + Math.sin(bandPhase * 0.3) * 0.1);

      const bandGrad = ctx.createLinearGradient(-width / 2, bandY, width / 2, bandY + bandHeight);
      bandGrad.addColorStop(0, colorUtils.toRgba(bandColor, 0));
      bandGrad.addColorStop(0.2, colorUtils.toRgba(bandColor, 0.4));
      bandGrad.addColorStop(0.4, colorUtils.toRgba(colorUtils.lerpColor(bandColor, nextColor, 0.5), 0.6));
      bandGrad.addColorStop(0.6, colorUtils.toRgba(nextColor, 0.5));
      bandGrad.addColorStop(0.8, colorUtils.toRgba(bandColor, 0.3));
      bandGrad.addColorStop(1, colorUtils.toRgba(bandColor, 0));

      ctx.beginPath();
      ctx.moveTo(-width / 2, bandY + bandHeight);
      const segments = 40;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = -width / 2 + t * width;
        const wave1 = Math.sin(t * Math.PI * 3 + bandPhase) * bandHeight * 0.3;
        const wave2 = Math.sin(t * Math.PI * 5 + bandPhase * 1.3) * bandHeight * 0.15;
        const wave3 = Math.sin(t * Math.PI * 7 + bandPhase * 0.7) * bandHeight * 0.08;
        const y = bandY + wave1 + wave2 + wave3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width / 2, bandY + bandHeight);
      ctx.closePath();
      ctx.fillStyle = bandGrad;
      ctx.fill();

      drawUtils.radialGlow(ctx, Math.sin(bandPhase) * width * 0.3, bandY + bandHeight * 0.3, bandHeight * 0.8, bandColor, 0.15 * intensity);
      ctx.restore();
    }

    for (let i = 0; i < 15; i++) {
      const curtainPhase = time * speed * 0.2 + i * 0.8;
      const curtainX = ((i * 2347) % 10000) / 10000 * width - width / 2;
      const curtainWave = Math.sin(curtainPhase) * 30;
      const curtainHeight = height * 0.3 + Math.sin(curtainPhase * 0.5) * height * 0.1;
      const curtainColor = aurora[i % aurora.length];

      ctx.save();
      ctx.globalAlpha = intensity * 0.15;
      const curtainGrad = ctx.createLinearGradient(curtainX + curtainWave, -height * 0.3, curtainX + curtainWave, -height * 0.3 + curtainHeight);
      curtainGrad.addColorStop(0, colorUtils.toRgba(curtainColor, 0.6));
      curtainGrad.addColorStop(0.3, colorUtils.toRgba(curtainColor, 0.3));
      curtainGrad.addColorStop(1, colorUtils.toRgba(curtainColor, 0));

      ctx.beginPath();
      ctx.moveTo(curtainX + curtainWave - 15, -height * 0.3);
      ctx.lineTo(curtainX + curtainWave + 15, -height * 0.3);
      ctx.lineTo(curtainX + curtainWave + 5, -height * 0.3 + curtainHeight);
      ctx.lineTo(curtainX + curtainWave - 5, -height * 0.3 + curtainHeight);
      ctx.closePath();
      ctx.fillStyle = curtainGrad;
      ctx.fill();
      ctx.restore();
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.015, time);
  },

  initParams: () => ({
    speed: 1,
    intensity: 0.8,
    bandCount: 5
  })
};
