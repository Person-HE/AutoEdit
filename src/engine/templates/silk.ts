import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const silkTemplate: TemplateDefinition = {
  id: 'bg_silk',
  name: '丝绸',
  description: '丝绸织物效果，带有光线反射和流动感',
  category: 'effect',
  schema: [
    { key: 'speed', label: '流动速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 },
    { key: 'intensity', label: '光泽强度', type: 'number', default: 0.8, min: 0.3, max: 1.5, step: 0.1 },
    { key: 'paletteName', label: '配色方案', type: 'select', default: 'royal', options: [{ label: '皇家', value: 'royal' }, { label: '梦幻', value: 'dream' }, { label: '霓虹', value: 'neon' }, { label: '余烬', value: 'ember' }] }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const intensity = paramGuard.number(params.intensity, 0.8, 0.3, 1.5);
    const paletteName = params.paletteName || 'royal';
    const p = paramGuard.number(progress, 0, 0, 1);

    const paletteMap: Record<string, string[]> = {
      royal: palettes.royal,
      dream: palettes.dream,
      neon: palettes.neon,
      ember: palettes.ember
    };
    const palette = paletteMap[paletteName] || palettes.royal;

    const baseGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [colorUtils.adjustBrightness(palette[0], -40), palette[0], colorUtils.adjustBrightness(palette[0], -30)], 135);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const foldCount = 12;
    for (let i = 0; i < foldCount; i++) {
      const foldPhase = time * speed * 0.3 + i * 0.5;
      const foldX = -width / 2 + (i / foldCount) * width;
      const foldWidth = width / foldCount;
      const isHighlight = i % 2 === 0;

      ctx.save();
      ctx.beginPath();
      for (let y = -height / 2; y <= height / 2; y += 5) {
        const waveX = foldX + Math.sin(y * 0.01 + foldPhase) * foldWidth * 0.3;
        if (y === -height / 2) ctx.moveTo(waveX, y);
        else ctx.lineTo(waveX, y);
      }
      for (let y = height / 2; y >= -height / 2; y -= 5) {
        const waveX = foldX + foldWidth + Math.sin(y * 0.01 + foldPhase + 0.5) * foldWidth * 0.3;
        ctx.lineTo(waveX, y);
      }
      ctx.closePath();

      const foldColor = palette[i % palette.length];
      const foldGrad = ctx.createLinearGradient(foldX, 0, foldX + foldWidth, 0);
      if (isHighlight) {
        foldGrad.addColorStop(0, colorUtils.toRgba(colorUtils.lerpColor(foldColor, '#ffffff', 0.1), 0.3));
        foldGrad.addColorStop(0.3, colorUtils.toRgba(colorUtils.lerpColor(foldColor, '#ffffff', 0.3), 0.5));
        foldGrad.addColorStop(0.5, colorUtils.toRgba(foldColor, 0.4));
        foldGrad.addColorStop(0.7, colorUtils.toRgba(colorUtils.adjustBrightness(foldColor, -20), 0.3));
        foldGrad.addColorStop(1, colorUtils.toRgba(colorUtils.adjustBrightness(foldColor, -30), 0.2));
      } else {
        foldGrad.addColorStop(0, colorUtils.toRgba(colorUtils.adjustBrightness(foldColor, -20), 0.2));
        foldGrad.addColorStop(0.3, colorUtils.toRgba(colorUtils.adjustBrightness(foldColor, -10), 0.3));
        foldGrad.addColorStop(0.5, colorUtils.toRgba(foldColor, 0.35));
        foldGrad.addColorStop(0.7, colorUtils.toRgba(colorUtils.lerpColor(foldColor, '#ffffff', 0.15), 0.4));
        foldGrad.addColorStop(1, colorUtils.toRgba(colorUtils.lerpColor(foldColor, '#ffffff', 0.1), 0.3));
      }
      ctx.fillStyle = foldGrad;
      ctx.fill();
      ctx.restore();
    }

    const specCount = 6;
    for (let i = 0; i < specCount; i++) {
      const specPhase = time * speed * 0.5 + i * 1.2;
      const specX = Math.cos(specPhase * 0.4) * width * 0.35;
      const specY = Math.sin(specPhase * 0.3) * height * 0.3;
      const specW = 60 + Math.sin(specPhase) * 30;
      const specH = 20 + Math.cos(specPhase) * 10;
      drawUtils.specularHighlight(ctx, specX - specW / 2, specY - specH / 2, specW, specH, specH * 0.5, 0.2 * intensity);
    }

    const shimmerProgress = (time * speed * 0.2) % 1;
    drawUtils.shimmerLine(ctx, -width / 2, -height / 2, width, height, shimmerProgress, palette[1] || palette[0], 0.08 * intensity);

    drawUtils.vignette(ctx, width, height, 0.35);
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.015, time);
  },

  initParams: () => ({
    speed: 1,
    intensity: 0.8,
    paletteName: 'royal'
  })
};
