import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const gridDistortionTemplate: TemplateDefinition = {
  id: 'vfx_grid_distortion',
  name: '网格扭曲',
  description: '带有高级配色的网格扭曲效果',
  category: 'effect',
  schema: [
    { key: 'color1', label: '网格颜色1', type: 'color', default: '#00d4ff' },
    { key: 'color2', label: '网格颜色2', type: 'color', default: '#ff00e5' },
    { key: 'gridSize', label: '网格大小', type: 'number', default: 40, min: 20, max: 80, step: 5 },
    { key: 'distortionStrength', label: '扭曲强度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const color2 = paramGuard.color(params.color2, '#ff00e5');
    const gridSize = paramGuard.number(params.gridSize, 40, 20, 80);
    const distortionStrength = paramGuard.number(params.distortionStrength, 1, 0.5, 2);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const cols = Math.ceil(width / gridSize) + 2;
    const rows = Math.ceil(height / gridSize) + 2;
    const startX = -width / 2 - gridSize;
    const startY = -height / 2 - gridSize;

    const getDistortedPoint = (gx: number, gy: number) => {
      const distFromCenter = Math.sqrt(gx * gx + gy * gy);
      const wave1 = Math.sin(distFromCenter * 0.01 + time * 2) * 15 * distortionStrength;
      const wave2 = Math.cos(gx * 0.02 + time * 1.5) * 10 * distortionStrength;
      const wave3 = Math.sin(gy * 0.02 + time * 1.3) * 8 * distortionStrength;
      return {
        x: gx + wave2,
        y: gy + wave1 + wave3
      };
    };

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const gx = startX + col * gridSize;
        const gy = startY + row * gridSize;
        const dp = getDistortedPoint(gx, gy);
        const distFromCenter = Math.sqrt(gx * gx + gy * gy) / Math.max(width, height);
        const gridColor = colorUtils.lerpColor(color1, color2, distFromCenter);
        const gridAlpha = 0.15 + Math.sin(time + distFromCenter * 5) * 0.05;

        if (col < cols - 1) {
          const dpNext = getDistortedPoint(gx + gridSize, gy);
          ctx.save();
          ctx.strokeStyle = colorUtils.toRgba(gridColor, gridAlpha);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(dp.x, dp.y);
          ctx.lineTo(dpNext.x, dpNext.y);
          ctx.stroke();
          ctx.restore();
        }

        if (row < rows - 1) {
          const dpNext = getDistortedPoint(gx, gy + gridSize);
          ctx.save();
          ctx.strokeStyle = colorUtils.toRgba(gridColor, gridAlpha);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(dp.x, dp.y);
          ctx.lineTo(dpNext.x, dpNext.y);
          ctx.stroke();
          ctx.restore();
        }

        if (col % 3 === 0 && row % 3 === 0) {
          drawUtils.particle(ctx, dp.x, dp.y, 2, gridColor, gridAlpha * 1.5, 0.5);
        }
      }
    }

    const intersectionGlow = 8;
    for (let i = 0; i < intersectionGlow; i++) {
      const seed = i * 4919;
      const gx = ((seed * 7) % 10000) / 10000 * width - width / 2;
      const gy = ((seed * 11) % 10000) / 10000 * height - height / 2;
      const dp = getDistortedPoint(gx, gy);
      const glowColor = colorUtils.lerpColor(color1, color2, i / intersectionGlow);
      drawUtils.radialGlow(ctx, dp.x, dp.y, 25, glowColor, 0.1);
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    color2: '#ff00e5',
    gridSize: 40,
    distortionStrength: 1
  })
};
