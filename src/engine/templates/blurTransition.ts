import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const blurTransitionTemplate: TemplateDefinition = {
  id: 'transition_blur',
  name: '模糊转场',
  description: '带有景深效果的模糊转场',
  category: 'transition',
  schema: [
    { key: 'blurColor', label: '模糊颜色', type: 'color', default: '#0a0a1a' },
    { key: 'maxBlur', label: '最大模糊', type: 'number', default: 30, min: 10, max: 60, step: 5 },
    { key: 'bloomIntensity', label: '泛光强度', type: 'number', default: 0.5, min: 0, max: 1, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const blurColor = paramGuard.color(params.blurColor, '#0a0a1a');
    const maxBlur = paramGuard.number(params.maxBlur, 30, 10, 60);
    const bloomIntensity = paramGuard.number(params.bloomIntensity, 0.5, 0, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    let blurAmount: number;
    if (p < 0.5) {
      blurAmount = easing.easeInOutCubic(p * 2);
    } else {
      blurAmount = easing.easeInOutCubic(1 - (p - 0.5) * 2);
    }

    const currentBlur = blurAmount * maxBlur;
    const overlayAlpha = blurAmount * 0.7;

    const overlayGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [blurColor, colorUtils.lerpColor(blurColor, '#ffffff', 0.05), blurColor], 135);
    ctx.fillStyle = overlayGrad;
    ctx.globalAlpha = overlayAlpha;
    ctx.filter = `blur(${currentBlur}px)`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

    if (blurAmount > 0.3 && bloomIntensity > 0) {
      const bloomAlpha = (blurAmount - 0.3) * bloomIntensity * 1.5;
      drawUtils.radialGlow(ctx, 0, 0, width * 0.4, '#ffffff', bloomAlpha * 0.1);
      drawUtils.multiLayerGlow(ctx, 0, 0, colorUtils.lerpColor(blurColor, '#ffffff', 0.3), width * 0.15, 3);
    }

    if (blurAmount > 0.5) {
      const vignetteAlpha = (blurAmount - 0.5) * 2;
      drawUtils.vignette(ctx, width, height, 0.6 * vignetteAlpha);
    }

    if (blurAmount > 0.2) {
      const noiseAlpha = blurAmount * 0.02;
      drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, noiseAlpha, time);
    }
  },

  initParams: () => ({
    blurColor: '#0a0a1a',
    maxBlur: 30,
    bloomIntensity: 0.5
  })
};
