import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const energyRingTemplate: TemplateDefinition = {
  id: 'vfx_energy_ring',
  name: '能量环',
  description: '带有粒子拖尾的能量环效果',
  category: 'effect',
  schema: [
    { key: 'color1', label: '主颜色', type: 'color', default: '#00d4ff' },
    { key: 'color2', label: '副颜色', type: 'color', default: '#ff00e5' },
    { key: 'radius', label: '环半径', type: 'number', default: 120, min: 60, max: 250, step: 10 },
    { key: 'particleCount', label: '粒子数量', type: 'number', default: 40, min: 15, max: 80, step: 5 },
    { key: 'rotationSpeed', label: '旋转速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const color2 = paramGuard.color(params.color2, '#ff00e5');
    const radius = paramGuard.number(params.radius, 120, 60, 250);
    const particleCount = paramGuard.number(params.particleCount, 40, 15, 80);
    const rotationSpeed = paramGuard.number(params.rotationSpeed, 1, 0.5, 3);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const enterProgress = easing.spring(Math.min(1, p / 0.3), 100, 14, 1);
    const currentRadius = radius * enterProgress;
    const rotation = time * rotationSpeed;

    drawUtils.multiLayerGlow(ctx, 0, 0, color1, currentRadius * 0.5, 4);
    drawUtils.radialGlow(ctx, 0, 0, currentRadius * 1.5, color1, 0.08);

    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = currentRadius * (0.9 + ring * 0.1);
      const ringAlpha = (0.4 - ring * 0.1) * enterProgress;
      const ringColor = colorUtils.lerpColor(color1, color2, ring / 3);
      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(ringColor, ringAlpha);
      ctx.lineWidth = 2 - ring * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + rotation;
      const px = Math.cos(angle) * currentRadius;
      const py = Math.sin(angle) * currentRadius;
      const particleColor = i % 2 === 0 ? color1 : color2;
      const pulse = 0.5 + Math.sin(time * 3 + i * 0.5) * 0.5;
      const particleAlpha = (0.5 + pulse * 0.5) * enterProgress;
      const particleSize = 3 + pulse * 2;

      drawUtils.particle(ctx, px, py, particleSize * 2, particleColor, particleAlpha * 0.3, 0.3);
      drawUtils.particle(ctx, px, py, particleSize, particleColor, particleAlpha, 0.7);

      const trailLen = 5;
      for (let t = 1; t <= trailLen; t++) {
        const trailAngle = angle - t * 0.05 * rotationSpeed;
        const tx = Math.cos(trailAngle) * currentRadius;
        const ty = Math.sin(trailAngle) * currentRadius;
        const trailAlpha = particleAlpha * (1 - t / trailLen) * 0.4;
        const trailSize = particleSize * (1 - t / trailLen * 0.5);
        drawUtils.particle(ctx, tx, ty, trailSize, particleColor, trailAlpha, 0.5);
      }
    }

    const arcCount = 3;
    for (let a = 0; a < arcCount; a++) {
      const arcStart = rotation * 2 + a * Math.PI * 2 / arcCount;
      const arcLen = Math.PI * 0.4 + Math.sin(time * 2 + a) * Math.PI * 0.1;
      const arcColor = colorUtils.lerpColor(color1, color2, a / arcCount);
      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(arcColor, 0.6 * enterProgress);
      ctx.lineWidth = 3;
      ctx.shadowColor = arcColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, arcStart, arcStart + arcLen);
      ctx.stroke();
      ctx.restore();
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    color2: '#ff00e5',
    radius: 120,
    particleCount: 40,
    rotationSpeed: 1
  })
};
