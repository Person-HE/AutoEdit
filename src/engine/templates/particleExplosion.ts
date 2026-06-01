import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const particleExplosionTemplate: TemplateDefinition = {
  id: 'vfx_particle_explosion',
  name: '粒子爆炸',
  description: '带有拖尾和余烬粒子的爆炸效果',
  category: 'effect',
  schema: [
    { key: 'color1', label: '主颜色', type: 'color', default: '#ff4500' },
    { key: 'color2', label: '副颜色', type: 'color', default: '#ffaa00' },
    { key: 'particleCount', label: '粒子数量', type: 'number', default: 60, min: 20, max: 120, step: 10 },
    { key: 'explosionForce', label: '爆炸力度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#ff4500');
    const color2 = paramGuard.color(params.color2, '#ffaa00');
    const particleCount = paramGuard.number(params.particleCount, 60, 20, 120);
    const explosionForce = paramGuard.number(params.explosionForce, 1, 0.5, 2);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050508', '#0a0a10', '#050508'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const explosionProgress = easing.easeOutCubic(p);
    const flashAlpha = Math.max(0, 1 - p * 5);
    if (flashAlpha > 0) {
      drawUtils.radialGlow(ctx, 0, 0, width * 0.5 * flashAlpha, '#ffffff', flashAlpha * 0.5);
      drawUtils.multiLayerGlow(ctx, 0, 0, color1, width * 0.2 * flashAlpha, 5);
    }

    const shockwaveRadius = explosionProgress * Math.min(width, height) * 0.4 * explosionForce;
    if (shockwaveRadius > 0 && p < 0.6) {
      const shockAlpha = (1 - p / 0.6) * 0.4;
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = shockwaveRadius * (0.8 + ring * 0.15);
        const ringAlpha = shockAlpha * (1 - ring * 0.3);
        ctx.save();
        ctx.strokeStyle = colorUtils.toRgba(colorUtils.lerpColor(color1, color2, ring / 3), ringAlpha);
        ctx.lineWidth = 3 - ring;
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        drawUtils.radialGlow(ctx, 0, 0, ringRadius, color1, ringAlpha * 0.1);
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      const seed = i * 3571;
      const angle = ((seed * 7) % 10000) / 10000 * Math.PI * 2;
      const speed = (0.3 + ((seed * 13) % 100) / 100 * 0.7) * explosionForce;
      const particleP = Math.min(1, p * 1.5);

      const dist = speed * explosionProgress * Math.min(width, height) * 0.35;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;

      const gravity = particleP * particleP * 50;
      const finalPy = py + gravity;

      const particleAlpha = Math.max(0, 1 - particleP * 1.2);
      const particleSize = (2 + ((seed * 11) % 100) / 100 * 4) * (1 - particleP * 0.5);
      const particleColor = i % 2 === 0 ? color1 : color2;

      if (particleAlpha > 0.05) {
        drawUtils.particle(ctx, px, finalPy, particleSize * 3, particleColor, particleAlpha * 0.3, 0.3);
        drawUtils.particle(ctx, px, finalPy, particleSize, particleColor, particleAlpha, 0.7);

        if (particleP < 0.5) {
          const trailLen = 3;
          for (let t = 1; t <= trailLen; t++) {
            const trailP = Math.max(0, particleP - t * 0.03);
            const trailDist = speed * easing.easeOutCubic(trailP) * Math.min(width, height) * 0.35;
            const trailX = Math.cos(angle) * trailDist;
            const trailY = Math.sin(angle) * trailDist + trailP * trailP * 50;
            const trailAlpha = particleAlpha * (1 - t / trailLen) * 0.4;
            const trailSize = particleSize * (1 - t / trailLen * 0.5);
            drawUtils.particle(ctx, trailX, trailY, trailSize, particleColor, trailAlpha, 0.5);
          }
        }
      }
    }

    const emberCount = 20;
    for (let i = 0; i < emberCount; i++) {
      const seed = i * 4919;
      const angle = ((seed * 7) % 10000) / 10000 * Math.PI * 2;
      const speed = (0.5 + ((seed * 13) % 100) / 100 * 0.5) * explosionForce;
      const dist = speed * explosionProgress * Math.min(width, height) * 0.3;
      const ex = Math.cos(angle) * dist + Math.sin(time * 3 + i) * 10;
      const ey = Math.sin(angle) * dist + p * p * 80;
      const emberAlpha = Math.max(0, 1 - p * 1.5) * 0.6;
      const emberColor = i % 3 === 0 ? '#ffee00' : color2;

      if (emberAlpha > 0.05) {
        drawUtils.particle(ctx, ex, ey, 2, emberColor, emberAlpha, 0.6);
      }
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.01, time);
  },

  initParams: () => ({
    color1: '#ff4500',
    color2: '#ffaa00',
    particleCount: 60,
    explosionForce: 1
  })
};
