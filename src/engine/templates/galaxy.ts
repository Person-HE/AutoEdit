import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const galaxyTemplate: TemplateDefinition = {
  id: 'bg_galaxy',
  name: '银河',
  description: '深空银河效果，带有星云、星场和深度层次',
  category: 'effect',
  schema: [
    { key: 'speed', label: '旋转速度', type: 'number', default: 0.5, min: 0.1, max: 2, step: 0.1 },
    { key: 'starDensity', label: '星星密度', type: 'number', default: 150, min: 50, max: 300, step: 10 },
    { key: 'nebulaIntensity', label: '星云强度', type: 'number', default: 0.8, min: 0.3, max: 1.5, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 0.5, 0.1, 2);
    const starDensity = paramGuard.number(params.starDensity, 150, 50, 300);
    const nebulaIntensity = paramGuard.number(params.nebulaIntensity, 0.8, 0.3, 1.5);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#020210', '#050520', '#0a0a30'], time * 0.03, 0.3);
    drawUtils.vignette(ctx, width, height, 0.5);

    const galaxy = palettes.galaxy;
    const nebulaCount = 4;
    for (let i = 0; i < nebulaCount; i++) {
      const phase = time * speed * 0.1 + i * Math.PI * 0.5;
      const nx = Math.cos(phase) * width * 0.2 + Math.sin(i * 2.3) * width * 0.15;
      const ny = Math.sin(phase * 0.7) * height * 0.2 + Math.cos(i * 1.7) * height * 0.1;
      const nSize = width * (0.15 + i * 0.05);
      const nebulaColor = galaxy[i % galaxy.length];

      ctx.save();
      ctx.globalAlpha = nebulaIntensity * 0.2;
      const nebulaGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nSize);
      nebulaGrad.addColorStop(0, colorUtils.toRgba(nebulaColor, 0.4));
      nebulaGrad.addColorStop(0.2, colorUtils.toRgba(colorUtils.lerpColor(nebulaColor, '#ffffff', 0.2), 0.25));
      nebulaGrad.addColorStop(0.5, colorUtils.toRgba(nebulaColor, 0.1));
      nebulaGrad.addColorStop(1, colorUtils.toRgba(nebulaColor, 0));
      ctx.fillStyle = nebulaGrad;
      ctx.beginPath();
      ctx.ellipse(nx, ny, nSize, nSize * 0.6, phase * 0.2, 0, Math.PI * 2);
      ctx.fill();

      drawUtils.radialGlow(ctx, nx, ny, nSize * 0.8, nebulaColor, 0.1 * nebulaIntensity);
      ctx.restore();
    }

    const rotation = time * speed * 0.05;
    for (let i = 0; i < starDensity; i++) {
      const seed = i * 4919;
      const depth = 0.2 + ((seed * 13) % 100) / 100 * 0.8;
      const angle = ((seed * 7) % 10000) / 10000 * Math.PI * 2 + rotation * depth;
      const dist = ((seed * 11) % 10000) / 10000;
      const armOffset = Math.floor(((seed * 3) % 100) / 33) * Math.PI * 2 / 3;
      const spiralAngle = angle + armOffset + dist * Math.PI * 0.8;
      const spiralDist = dist * Math.min(width, height) * 0.4;

      const sx = Math.cos(spiralAngle) * spiralDist;
      const sy = Math.sin(spiralAngle) * spiralDist * 0.5;
      const twinkle = Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5;
      const starSize = (0.5 + depth * 2.5) * (0.7 + twinkle * 0.3);
      const starAlpha = depth * (0.3 + twinkle * 0.5) * (1 - dist * 0.3);

      const starColors = ['#ffffff', '#ffe4c4', '#c4d4ff', '#ffd4e4', '#d4ffe4'];
      const starColor = starColors[i % starColors.length];

      drawUtils.particle(ctx, sx, sy, starSize * 3, starColor, starAlpha * 0.2, 0.3);
      drawUtils.particle(ctx, sx, sy, starSize, starColor, starAlpha, 0.8);

      if (depth > 0.7 && starSize > 2) {
        drawUtils.radialGlow(ctx, sx, sy, starSize * 4, starColor, starAlpha * 0.1);
      }
    }

    const brightStarCount = 5;
    for (let i = 0; i < brightStarCount; i++) {
      const phase = time * 0.2 + i * 1.3;
      const bx = Math.cos(phase * 0.5 + i * 2) * width * 0.3;
      const by = Math.sin(phase * 0.3 + i * 1.5) * height * 0.25;
      const pulse = 0.5 + Math.sin(time * 2 + i * 1.5) * 0.5;

      drawUtils.multiLayerGlow(ctx, bx, by, '#ffffff', 15 + pulse * 10, 4);
      drawUtils.particle(ctx, bx, by, 3 + pulse * 2, '#ffffff', 0.8, 0.9);

      ctx.save();
      ctx.globalAlpha = 0.3 * pulse;
      ctx.strokeStyle = colorUtils.toRgba('#ffffff', 0.3);
      ctx.lineWidth = 0.5;
      const rayLen = 15 + pulse * 10;
      for (let r = 0; r < 4; r++) {
        const rayAngle = r * Math.PI / 2 + time * 0.1;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(rayAngle) * 3, by + Math.sin(rayAngle) * 3);
        ctx.lineTo(bx + Math.cos(rayAngle) * rayLen, by + Math.sin(rayAngle) * rayLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.012, time);
  },

  initParams: () => ({
    speed: 0.5,
    starDensity: 150,
    nebulaIntensity: 0.8
  })
};
