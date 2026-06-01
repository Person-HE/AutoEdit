import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const liquidEtherTemplate: TemplateDefinition = {
  id: 'bg_liquid_ether',
  name: '液态以太',
  description: '液态金属效果，带有流动反射和渐变色彩',
  category: 'effect',
  schema: [
    { key: 'speed', label: '流动速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 },
    { key: 'intensity', label: '反射强度', type: 'number', default: 0.8, min: 0.3, max: 1.5, step: 0.1 },
    { key: 'colorShift', label: '色彩偏移', type: 'number', default: 0, min: 0, max: 360, step: 15 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const intensity = paramGuard.number(params.intensity, 0.8, 0.3, 1.5);
    const p = paramGuard.number(progress, 0, 0, 1);

    const bgGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, ['#0a0a15', '#0f0f25', '#0a0a1a'], 135);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    drawUtils.vignette(ctx, width, height, 0.4);

    const blobCount = 6;
    for (let i = 0; i < blobCount; i++) {
      const phase = time * speed * 0.2 + i * Math.PI * 2 / blobCount;
      const bx = Math.cos(phase) * width * 0.25;
      const by = Math.sin(phase * 0.7 + i) * height * 0.25;
      const blobSize = width * 0.2 + Math.sin(phase * 0.5) * width * 0.05;
      const palette = palettes.premium;
      const blobColor = palette[i % palette.length];

      ctx.save();
      ctx.globalAlpha = intensity * 0.25;
      drawUtils.radialGlow(ctx, bx, by, blobSize, blobColor, 0.4);
      drawUtils.multiLayerGlow(ctx, bx, by, blobColor, blobSize * 0.5, 4);

      const blobGrad = ctx.createRadialGradient(bx, by, 0, bx, by, blobSize);
      blobGrad.addColorStop(0, colorUtils.toRgba(blobColor, 0.5));
      blobGrad.addColorStop(0.3, colorUtils.toRgba(colorUtils.lerpColor(blobColor, '#ffffff', 0.3), 0.3));
      blobGrad.addColorStop(0.6, colorUtils.toRgba(blobColor, 0.15));
      blobGrad.addColorStop(1, colorUtils.toRgba(blobColor, 0));
      ctx.fillStyle = blobGrad;
      ctx.beginPath();
      ctx.ellipse(bx, by, blobSize, blobSize * 0.7, phase * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let y = -height / 2; y < height / 2; y += 3) {
      const waveOffset = Math.sin(y * 0.01 + time * speed * 0.5) * 2;
      const alpha = 0.02 + Math.abs(Math.sin(y * 0.005 + time * 0.3)) * 0.03;
      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba('#ffffff', alpha * intensity);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-width / 2, y + waveOffset);
      ctx.lineTo(width / 2, y + waveOffset);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < 8; i++) {
      const specPhase = time * speed * 0.4 + i * 1.5;
      const specX = Math.cos(specPhase * 0.7) * width * 0.3;
      const specY = Math.sin(specPhase * 0.5) * height * 0.3;
      const specSize = 20 + Math.sin(specPhase) * 10;
      drawUtils.specularHighlight(ctx, specX - specSize, specY - specSize / 2, specSize * 2, specSize, specSize * 0.3, 0.15 * intensity);
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.02, time);
  },

  initParams: () => ({
    speed: 1,
    intensity: 0.8,
    colorShift: 0
  })
};
