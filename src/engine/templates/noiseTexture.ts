import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const noiseTextureTemplate: TemplateDefinition = {
  id: 'vfx_noise_texture',
  name: '噪点纹理',
  description: '带有色彩的艺术噪点纹理效果',
  category: 'effect',
  schema: [
    { key: 'color1', label: '主颜色', type: 'color', default: '#00d4ff' },
    { key: 'color2', label: '副颜色', type: 'color', default: '#ff00e5' },
    { key: 'intensity', label: '噪点强度', type: 'number', default: 0.5, min: 0.1, max: 1, step: 0.05 },
    { key: 'scale', label: '噪点缩放', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color1 = paramGuard.color(params.color1, '#00d4ff');
    const color2 = paramGuard.color(params.color2, '#ff00e5');
    const intensity = paramGuard.number(params.intensity, 0.5, 0.1, 1);
    const scale = paramGuard.number(params.scale, 1, 0.5, 3);
    const p = paramGuard.number(progress, 0, 0, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, [colorUtils.adjustBrightness(color1, -60), colorUtils.adjustBrightness(color2, -60), '#0a0a15'], time * 0.08, 0.3);
    drawUtils.vignette(ctx, width, height, 0.4);

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, intensity * 0.08 * scale, time);

    const blobCount = 5;
    for (let i = 0; i < blobCount; i++) {
      const phase = time * 0.2 + i * 1.2;
      const bx = Math.cos(phase * 0.5) * width * 0.3;
      const by = Math.sin(phase * 0.3) * height * 0.3;
      const blobColor = i % 2 === 0 ? color1 : color2;
      drawUtils.radialGlow(ctx, bx, by, width * 0.15, blobColor, 0.08 * intensity);
      drawUtils.multiLayerGlow(ctx, bx, by, blobColor, width * 0.08, 3);
    }

    const shimmerProgress = (time * 0.15) % 1;
    drawUtils.shimmerLine(ctx, -width / 2, -height / 2, width, height, shimmerProgress, colorUtils.lerpColor(color1, color2, 0.5), 0.05 * intensity);

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, intensity * 0.04, time);
  },

  initParams: () => ({
    color1: '#00d4ff',
    color2: '#ff00e5',
    intensity: 0.5,
    scale: 1
  })
};
