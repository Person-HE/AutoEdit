import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing, hash } from '../templateUtils';

export const particleTunnelTemplate: TemplateDefinition = {
  id: 'bg_particle_tunnel',
  name: '粒子隧道',
  description: '3D 粒子隧道穿越效果，前景粒子快速掠过，中心汇聚产生强烈纵深感',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['neon', 'hologram'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeOutExpo', 'inertiaDecay'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'count', label: '粒子数', type: 'number', default: 80, min: 30, max: 200, step: 10 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00f0ff');
    const speed = paramGuard.number(params.speed, 2, 0.5, 5);
    const count = paramGuard.number(params.count, 80, 30, 200);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const fov = 300;

    for (let i = 0; i < count; i++) {
      const seed = i * 7919;
      const angle = hash.float(seed) * Math.PI * 2;
      const radiusBase = 20 + hash.float(seed + 1) * 400;
      const z = ((time * speed * 150 + hash.float(seed + 2) * 3000) % 3000);
      const actualZ = z + 50;
      const scale = fov / actualZ;
      const x = Math.cos(angle + time * 0.2) * radiusBase * scale;
      const y = Math.sin(angle + time * 0.2) * radiusBase * scale * 0.6;
      const size = (1 + hash.float(seed + 3) * 3) * scale;
      const alpha = Math.min(1, scale * 1.5) * p;

      if (size < 0.3) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 中心汇聚辉光
    drawUtils.radialGlow(ctx, 0, 0, width * 0.4, color, 0.2 * p);
  },
  initParams: () => ({
    color: '#00f0ff',
    speed: 2,
    count: 80,
  }),
};
