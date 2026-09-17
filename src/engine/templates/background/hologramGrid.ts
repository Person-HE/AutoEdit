import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const hologramGridTemplate: TemplateDefinition = {
  id: 'bg_hologram_grid',
  name: '全息网格',
  description: '3D 透视全息网格，带深度感和发光地平线，前景粒子掠过的空间层次',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['hologram', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'inertiaDecay'],
  schema: [
    { key: 'gridColor', label: '网格颜色', type: 'color', default: '#00f0ff' },
    { key: 'horizonGlow', label: '地平线辉光', type: 'color', default: '#ff00a0' },
    { key: 'speed', label: '移动速度', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const gridColor = params.gridColor || '#00f0ff';
    const horizonGlow = params.horizonGlow || '#ff00a0';
    const speed = Math.max(0.2, Math.min(3, params.speed ?? 1));
    const p = paramGuard.number(progress, 0, 0, 1);

    // 深空背景
    const bg = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    bg.addColorStop(0, '#020205');
    bg.addColorStop(0.5, '#0a0014');
    bg.addColorStop(1, '#020205');
    ctx.fillStyle = bg;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 地平线辉光
    const horizonY = height * 0.25;
    const horizon = ctx.createLinearGradient(0, horizonY - 100, 0, horizonY + 200);
    horizon.addColorStop(0, 'rgba(255, 0, 160, 0)');
    horizon.addColorStop(0.5, 'rgba(255, 0, 160, 0.25)');
    horizon.addColorStop(1, 'rgba(255, 0, 160, 0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(-width / 2, horizonY - 100, width, 300);

    // 3D 透视网格
    drawUtils.perspectiveGrid(ctx, width, height, height * 0.35, time, gridColor, speed);

    // 前景快速掠过粒子
    ctx.save();
    for (let i = 0; i < 25; i++) {
      const seed = i * 137;
      const x = ((seed * 59) % width) - width / 2;
      const y = -height / 2 + ((time * speed * 60 + seed) % height);
      const size = 2 + (seed % 4);
      ctx.globalAlpha = 0.3 + 0.4 * Math.sin(time * 3 + i);
      ctx.fillStyle = gridColor;
      ctx.fillRect(x, y, size * 3, size);
    }
    ctx.restore();

    // 暗角
    drawUtils.vignette(ctx, width, height, 0.45);
  },
  initParams: () => ({
    gridColor: '#00f0ff',
    horizonGlow: '#ff00a0',
    speed: 1,
  }),
};
