import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const dataStreamTemplate: TemplateDefinition = {
  id: 'vfx_data_stream',
  name: '数据流',
  description: '带有发光效果的数据流动画',
  category: 'effect',
  schema: [
    { key: 'color1', label: '主颜色', type: 'color', default: '#00d4ff' },
    { key: 'color2', label: '副颜色', type: 'color', default: '#ff00e5' },
    { key: 'streamCount', label: '流数量', type: 'number', default: 8, min: 4, max: 16, step: 1 },
    { key: 'speed', label: '流动速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const color2 = paramGuard.color(params.color2, '#ff00e5');
    const streamCount = paramGuard.number(params.streamCount, 8, 4, 16);
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, ['#050510', '#0a0a18', '#050510'], time * 0.05, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    for (let i = 0; i < streamCount; i++) {
      const seed = i * 2137;
      const streamColor = colorUtils.lerpColor(color1, color2, i / streamCount);
      const streamY = -height / 2 + (i + 0.5) * height / streamCount;
      const streamSpeed = (0.5 + ((seed * 7) % 100) / 100 * 0.5) * speed;
      const streamPhase = time * streamSpeed * 0.5;

      ctx.save();
      const streamGrad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
      streamGrad.addColorStop(0, colorUtils.toRgba(streamColor, 0));
      streamGrad.addColorStop(0.2, colorUtils.toRgba(streamColor, 0.3));
      streamGrad.addColorStop(0.5, colorUtils.toRgba(streamColor, 0.5));
      streamGrad.addColorStop(0.8, colorUtils.toRgba(streamColor, 0.3));
      streamGrad.addColorStop(1, colorUtils.toRgba(streamColor, 0));

      ctx.strokeStyle = streamGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -width / 2; x <= width / 2; x += 5) {
        const wave = Math.sin(x * 0.02 + streamPhase) * 8 + Math.sin(x * 0.05 + streamPhase * 1.5) * 4;
        const y = streamY + wave;
        if (x === -width / 2) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      const nodeCount = 6;
      for (let n = 0; n < nodeCount; n++) {
        const nodePhase = streamPhase + n * 1.5 + ((seed * 11) % 100) / 100;
        const nodeX = ((nodePhase * 0.3) % 1) * width - width / 2;
        const nodeWave = Math.sin(nodeX * 0.02 + streamPhase) * 8 + Math.sin(nodeX * 0.05 + streamPhase * 1.5) * 4;
        const nodeY = streamY + nodeWave;
        const nodeAlpha = 0.5 + Math.sin(time * 3 + n + i) * 0.3;

        drawUtils.particle(ctx, nodeX, nodeY, 6, streamColor, nodeAlpha * 0.4, 0.4);
        drawUtils.particle(ctx, nodeX, nodeY, 3, '#ffffff', nodeAlpha * 0.6, 0.7);
        drawUtils.radialGlow(ctx, nodeX, nodeY, 15, streamColor, nodeAlpha * 0.15);
      }
    }

    const crossStreamCount = 4;
    for (let i = 0; i < crossStreamCount; i++) {
      const streamColor = colorUtils.lerpColor(color2, color1, i / crossStreamCount);
      const streamX = -width / 2 + (i + 0.5) * width / crossStreamCount;
      const streamPhase = time * speed * 0.3 + i * 0.8;

      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(streamColor, 0.15);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = -height / 2; y <= height / 2; y += 5) {
        const wave = Math.sin(y * 0.02 + streamPhase) * 6;
        const x = streamX + wave;
        if (y === -height / 2) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    color2: '#ff00e5',
    streamCount: 8,
    speed: 1
  })
};
