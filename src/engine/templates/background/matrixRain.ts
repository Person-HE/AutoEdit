import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing, hash } from '../templateUtils';

export const matrixRainTemplate: TemplateDefinition = {
  id: 'bg_matrix_rain',
  name: '矩阵代码雨',
  description: '多层纵深矩阵雨，前景快速、中景清晰、背景模糊，带 CRT 扫描线',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'tension'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce', 'inertiaDecay'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00ff9d' },
    { key: 'density', label: '密度', type: 'number', default: 60, min: 20, max: 150, step: 10 },
    { key: 'speed', label: '速度', type: 'number', default: 1.5, min: 0.5, max: 4, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00ff9d');
    const density = paramGuard.number(params.density, 60, 20, 150);
    const speed = paramGuard.number(params.speed, 1.5, 0.5, 4);
    const p = paramGuard.number(progress, 0, 0, 1);

    // 背景渐变
    const bg = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    bg.addColorStop(0, '#000000');
    bg.addColorStop(1, '#001100');
    ctx.fillStyle = bg;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const chars = 'ｱｲｳｴｵｶｷｸｹｺﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789';
    const layers = [
      { z: 0.3, alpha: 0.25, blur: 0, size: 16, speedMul: 0.4 },
      { z: 0.6, alpha: 0.55, blur: 0, size: 22, speedMul: 0.75 },
      { z: 1.0, alpha: 0.9, blur: 0, size: 28, speedMul: 1.2 },
    ];

    layers.forEach(layer => {
      ctx.save();
      ctx.font = `${layer.size}px monospace`;
      ctx.textAlign = 'center';
      const cols = Math.floor(width / (layer.size * 1.5));
      for (let i = 0; i < cols * density / 60; i++) {
        const seed = i * 137 + Math.floor(layer.z * 10);
        const x = -width / 2 + (hash.float(seed) * cols + 0.5) * layer.size * 1.5;
        const headY = -height / 2 + ((time * speed * 80 * layer.speedMul + hash.float(seed + 1) * height * 2) % (height * 1.5));
        const tailLen = 6 + hash.int(seed + 2, 4, 14);
        for (let j = 0; j < tailLen; j++) {
          const y = headY - j * layer.size * 1.2;
          if (y < -height / 2 || y > height / 2) continue;
          const charIndex = Math.floor((time * 10 * layer.speedMul + i * 7 + j * 3) % chars.length);
          const alpha = layer.alpha * (1 - j / tailLen) * p;
          ctx.fillStyle = j === 0 ? '#ffffff' : color.replace('#', 'rgba(').replace(')', `,${alpha})`);
          ctx.globalAlpha = alpha;
          ctx.fillText(chars[charIndex], x, y);
        }
      }
      ctx.restore();
    });

    drawUtils.scanlines(ctx, width, height, 4, 0.08);
    drawUtils.vignette(ctx, width, height, 0.5);
  },
  initParams: () => ({
    color: '#00ff9d',
    density: 60,
    speed: 1.5,
  }),
};
