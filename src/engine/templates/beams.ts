import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const beamsTemplate: TemplateDefinition = {
  id: 'vfx_beams',
  name: '光束',
  description: '带有发光效果的光束动画',
  category: 'effect',
  schema: [
    { key: 'color1', label: '光束颜色1', type: 'color', default: '#00d4ff' },
    { key: 'color2', label: '光束颜色2', type: 'color', default: '#ff00e5' },
    { key: 'beamCount', label: '光束数量', type: 'number', default: 5, min: 2, max: 10, step: 1 },
    { key: 'beamWidth', label: '光束宽度', type: 'number', default: 3, min: 1, max: 8, step: 1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const color2 = paramGuard.color(params.color2, '#ff00e5');
    const beamCount = paramGuard.number(params.beamCount, 5, 2, 10);
    const beamWidth = paramGuard.number(params.beamWidth, 3, 1, 8);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const enterProgress = easing.easeOutCubic(Math.min(1, p / 0.4));

    for (let i = 0; i < beamCount; i++) {
      const beamAngle = (i / beamCount) * Math.PI + Math.PI / 4 + Math.sin(time * 0.3 + i) * 0.15;
      const beamColor = colorUtils.lerpColor(color1, color2, i / beamCount);
      const beamAlpha = (0.4 + Math.sin(time * 2 + i * 0.8) * 0.15) * enterProgress;
      const startX = -width / 2;
      const startY = -height / 2 + (i + 0.5) * height / beamCount + Math.sin(time * 0.5 + i) * 20;
      const endX = width / 2;
      const endY = startY + Math.tan(beamAngle - Math.PI / 4) * width;

      drawUtils.lightBeam(ctx, startX, startY, endX, endY, beamColor, beamAlpha, beamWidth);

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      drawUtils.radialGlow(ctx, midX, midY, 30, beamColor, beamAlpha * 0.3);

      const particleCount = 5;
      for (let j = 0; j < particleCount; j++) {
        const t = ((time * 0.5 + j / particleCount + i * 0.2) % 1);
        const px = startX + (endX - startX) * t;
        const py = startY + (endY - startY) * t;
        drawUtils.particle(ctx, px, py, 3, beamColor, beamAlpha * 0.5, 0.5);
      }
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    color2: '#ff00e5',
    beamCount: 5,
    beamWidth: 3
  })
};
