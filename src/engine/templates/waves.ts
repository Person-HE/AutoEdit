import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const wavesTemplate: TemplateDefinition = {
  id: 'bg_waves',
  name: '海浪',
  description: '带有渐变深度和光影效果的海浪动画',
  category: 'effect',
  schema: [
    { key: 'speed', label: '波浪速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 },
    { key: 'waveHeight', label: '波浪高度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 },
    { key: 'layerCount', label: '波浪层数', type: 'number', default: 5, min: 3, max: 8, step: 1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const waveHeight = paramGuard.number(params.waveHeight, 1, 0.5, 2);
    const layerCount = paramGuard.number(params.layerCount, 5, 3, 8);
    const p = paramGuard.number(progress, 0, 0, 1);

    const skyGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, ['#0a0a2e', '#1a1a4e', '#2a2a5e', '#1a1a3e'], 180);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.vignette(ctx, width, height, 0.3);

    const moonX = width * 0.25;
    const moonY = -height * 0.25;
    drawUtils.multiLayerGlow(ctx, moonX, moonY, '#e8e0ff', 40, 5);
    drawUtils.particle(ctx, moonX, moonY, 25, '#ffffff', 0.9, 0.9);
    drawUtils.radialGlow(ctx, moonX, moonY, 80, '#e8e0ff', 0.15);

    const moonReflectGrad = ctx.createLinearGradient(moonX, 0, moonX, height / 2);
    moonReflectGrad.addColorStop(0, colorUtils.toRgba('#e8e0ff', 0.15));
    moonReflectGrad.addColorStop(0.5, colorUtils.toRgba('#e8e0ff', 0.05));
    moonReflectGrad.addColorStop(1, colorUtils.toRgba('#e8e0ff', 0));
    ctx.fillStyle = moonReflectGrad;
    ctx.fillRect(moonX - 20, 0, 40, height / 2);

    const waveColors = [
      ['#0a1a3a', '#0f2a5a', '#1a3a7a'],
      ['#0f2a5a', '#1a3a7a', '#2a4a8a'],
      ['#1a3a7a', '#2a4a8a', '#3a5a9a'],
      ['#2a4a8a', '#3a5a9a', '#4a6aaa'],
      ['#3a5a9a', '#4a6aaa', '#5a7aba']
    ];

    for (let layer = 0; layer < layerCount; layer++) {
      const layerT = layer / layerCount;
      const baseY = height * 0.05 + layerT * height * 0.4;
      const amplitude = (20 + layer * 8) * waveHeight;
      const frequency = 0.008 - layer * 0.0005;
      const phaseOffset = layer * 0.8;
      const colors = waveColors[layer % waveColors.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-width / 2, height / 2);
      ctx.lineTo(-width / 2, baseY);

      const segments = 60;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = -width / 2 + t * width;
        const wave1 = Math.sin(t * Math.PI * 4 * (1 + layer * 0.3) + time * speed * 1.5 + phaseOffset) * amplitude;
        const wave2 = Math.sin(t * Math.PI * 6 + time * speed * 2 + phaseOffset * 1.3) * amplitude * 0.3;
        const wave3 = Math.sin(t * Math.PI * 8 + time * speed * 0.8 + phaseOffset * 0.7) * amplitude * 0.15;
        const y = baseY + wave1 + wave2 + wave3;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width / 2, height / 2);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, baseY - amplitude, 0, height / 2);
      waveGrad.addColorStop(0, colors[0]);
      waveGrad.addColorStop(0.5, colors[1]);
      waveGrad.addColorStop(1, colors[2]);
      ctx.fillStyle = waveGrad;
      ctx.fill();

      if (layer < 2) {
        ctx.save();
        ctx.globalAlpha = 0.3 - layer * 0.1;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const x = -width / 2 + t * width;
          const wave1 = Math.sin(t * Math.PI * 4 * (1 + layer * 0.3) + time * speed * 1.5 + phaseOffset) * amplitude;
          const wave2 = Math.sin(t * Math.PI * 6 + time * speed * 2 + phaseOffset * 1.3) * amplitude * 0.3;
          const y = baseY + wave1 + wave2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colorUtils.toRgba('#ffffff', 0.2);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    const foamCount = 20;
    for (let i = 0; i < foamCount; i++) {
      const seed = i * 3517;
      const foamPhase = time * speed * 0.5 + i * 0.5;
      const fx = ((seed * 7) % 10000) / 10000 * width - width / 2 + Math.sin(foamPhase) * 20;
      const fy = height * 0.05 + ((seed * 11) % 10000) / 10000 * height * 0.3;
      const foamAlpha = 0.1 + Math.sin(foamPhase * 2) * 0.05;
      drawUtils.particle(ctx, fx, fy, 3, '#ffffff', foamAlpha, 0.5);
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    speed: 1,
    waveHeight: 1,
    layerCount: 5
  })
};
