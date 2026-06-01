import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; alpha: number; life: number; maxLife: number; depth: number;
}

function getParticles(time: number, width: number, height: number, count: number, palette: string[]): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 3571;
    const depth = 0.3 + ((seed * 13) % 100) / 100 * 0.7;
    const baseX = ((seed * 7) % 10000) / 10000;
    const baseY = ((seed * 11) % 10000) / 10000;
    const speed = 0.02 + depth * 0.03;
    const x = ((baseX + time * speed * ((seed % 2) ? 1 : -1)) % 1) * width - width / 2;
    const y = ((baseY + time * speed * 0.5 * ((seed % 3) ? 1 : -0.5)) % 1) * height - height / 2;
    const size = (2 + depth * 6) * (0.8 + Math.sin(time * 2 + i) * 0.2);
    const color = palette[i % palette.length];
    const alpha = depth * (0.4 + Math.sin(time * 1.5 + i * 0.3) * 0.2);
    particles.push({ x, y, vx: 0, vy: 0, size, color, alpha, life: 1, maxLife: 1, depth });
  }
  return particles;
}

export const particlesTemplate: TemplateDefinition = {
  id: 'bg_particles',
  name: '粒子',
  description: '高级粒子系统，带有深度层次和发光效果',
  category: 'effect',
  schema: [
    { key: 'count', label: '粒子数量', type: 'number', default: 80, min: 20, max: 200, step: 10 },
    { key: 'speed', label: '运动速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 0.8, min: 0.3, max: 1.5, step: 0.1 },
    { key: 'paletteName', label: '配色方案', type: 'select', default: 'neon', options: [{ label: '霓虹', value: 'neon' }, { label: '赛博朋克', value: 'cyberpunk' }, { label: '梦幻', value: 'dream' }, { label: '极光', value: 'aurora' }] }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const count = paramGuard.number(params.count, 80, 20, 200);
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const glowIntensity = paramGuard.number(params.glowIntensity, 0.8, 0.3, 1.5);
    const paletteName = params.paletteName || 'neon';
    const p = paramGuard.number(progress, 0, 0, 1);

    const paletteMap: Record<string, string[]> = {
      neon: palettes.neon,
      cyberpunk: palettes.cyberpunk,
      dream: palettes.dream,
      aurora: palettes.aurora
    };
    const palette = paletteMap[paletteName] || palettes.neon;

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050510', '#0a0a20', '#0f0f30'], time * 0.08, 0.25);
    drawUtils.vignette(ctx, width, height, 0.4);

    const particles = getParticles(time * speed, width, height, count, palette);
    particles.sort((a, b) => a.depth - b.depth);

    for (const particle of particles) {
      const glowSize = particle.size * (2 + glowIntensity * 2);
      drawUtils.particle(ctx, particle.x, particle.y, glowSize, particle.color, particle.alpha * glowIntensity * 0.3, 0.4);
      drawUtils.particle(ctx, particle.x, particle.y, particle.size, particle.color, particle.alpha, 0.7);
      drawUtils.radialGlow(ctx, particle.x, particle.y, particle.size * 3, particle.color, particle.alpha * glowIntensity * 0.15);
    }

    const connectionDist = 100;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDist && particles[i].depth > 0.5 && particles[j].depth > 0.5) {
          const lineAlpha = (1 - dist / connectionDist) * 0.15 * Math.min(particles[i].alpha, particles[j].alpha);
          ctx.save();
          ctx.strokeStyle = colorUtils.toRgba(particles[i].color, lineAlpha);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.01, time);
  },

  initParams: () => ({
    count: 80,
    speed: 1,
    glowIntensity: 0.8,
    paletteName: 'neon'
  })
};
