import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const fadeTransitionTemplate: TemplateDefinition = {
  id: 'transition_fade',
  name: '淡入淡出',
  description: '带有色彩分级效果的电影级淡入淡出转场',
  category: 'transition',
  schema: [
    { key: 'fadeColor', label: '淡入颜色', type: 'color', default: '#000000' },
    { key: 'tintIntensity', label: '色调强度', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05 },
    { key: 'tintColor', label: '色调颜色', type: 'color', default: '#1a1a3e' }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const fadeColor = paramGuard.color(params.fadeColor, '#000000');
    const tintIntensity = paramGuard.number(params.tintIntensity, 0.3, 0, 1);
    const tintColor = paramGuard.color(params.tintColor, '#1a1a3e');
    const p = paramGuard.number(progress, 0, 0, 1);

    let fadeAlpha: number;
    if (p < 0.5) {
      fadeAlpha = easing.easeInOutCubic(p * 2);
    } else {
      fadeAlpha = easing.easeInOutCubic(1 - (p - 0.5) * 2);
    }

    const tintAlpha = fadeAlpha * tintIntensity;
    const solidAlpha = fadeAlpha * (1 - tintIntensity);

    const overlayGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [fadeColor, colorUtils.lerpColor(fadeColor, tintColor, 0.3), fadeColor], 135);
    ctx.fillStyle = overlayGrad;
    ctx.globalAlpha = solidAlpha;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    ctx.globalAlpha = tintAlpha;
    const tintGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [tintColor, colorUtils.lerpColor(tintColor, '#ffffff', 0.1), tintColor], 90);
    ctx.fillStyle = tintGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    ctx.globalAlpha = 1;

    if (fadeAlpha > 0.5) {
      const vignetteAlpha = (fadeAlpha - 0.5) * 2;
      drawUtils.vignette(ctx, width, height, 0.7 * vignetteAlpha);
    }

    if (fadeAlpha > 0.3) {
      const noiseAlpha = (fadeAlpha - 0.3) * 0.5;
      drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, noiseAlpha * 0.03, time);
    }
  },

  initParams: () => ({
    fadeColor: '#000000',
    tintIntensity: 0.3,
    tintColor: '#1a1a3e'
  })
};
