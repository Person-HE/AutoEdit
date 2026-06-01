import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const gradualBlurTemplate: TemplateDefinition = {
  id: 'transition_gradual_blur',
  name: '渐进模糊',
  description: '渐进式模糊效果，带有景深和泛光',
  category: 'transition',
  schema: [
    { key: 'blurColor', label: '模糊颜色', type: 'color', default: '#0a0a1a' },
    { key: 'maxBlur', label: '最大模糊', type: 'number', default: 25, min: 10, max: 50, step: 5 },
    { key: 'bloomIntensity', label: '泛光强度', type: 'number', default: 0.4, min: 0, max: 1, step: 0.1 },
    { key: 'direction', label: '模糊方向', type: 'select', default: 'center', options: [{ label: '中心向外', value: 'center' }, { label: '从左到右', value: 'left' }, { label: '从上到下', value: 'top' }] }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const blurColor = paramGuard.color(params.blurColor, '#0a0a1a');
    const maxBlur = paramGuard.number(params.maxBlur, 25, 10, 50);
    const bloomIntensity = paramGuard.number(params.bloomIntensity, 0.4, 0, 1);
    const direction = params.direction || 'center';
    const p = paramGuard.number(progress, 0, 0, 1);

    let blurAmount: number;
    if (p < 0.5) {
      blurAmount = easing.easeInOutCubic(p * 2);
    } else {
      blurAmount = easing.easeInOutCubic(1 - (p - 0.5) * 2);
    }

    const currentBlur = blurAmount * maxBlur;
    const overlayAlpha = blurAmount * 0.6;

    const overlayGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [blurColor, colorUtils.lerpColor(blurColor, '#1a1a3e', 0.1), blurColor], 135);

    if (direction === 'center') {
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const stepP = Math.max(0, blurAmount - i / steps);
        if (stepP <= 0) continue;
        const stepRadius = (1 - i / steps) * Math.min(width, height) * 0.5;
        const stepBlur = currentBlur * (1 - i / steps);
        const stepAlpha = overlayAlpha * (1 - i / steps * 0.5);

        ctx.save();
        ctx.fillStyle = overlayGrad;
        ctx.globalAlpha = stepAlpha;
        ctx.filter = `blur(${stepBlur}px)`;
        ctx.beginPath();
        ctx.arc(0, 0, stepRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
        ctx.restore();
      }
    } else {
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const stepBlur = currentBlur * (1 - i / steps);
        const stepAlpha = overlayAlpha * (1 - i / steps * 0.5);
        let x = -width / 2, y = -height / 2, w = width, h = height;
        if (direction === 'left') {
          w = width * (1 - i / steps);
        } else if (direction === 'top') {
          h = height * (1 - i / steps);
        }

        ctx.save();
        ctx.fillStyle = overlayGrad;
        ctx.globalAlpha = stepAlpha;
        ctx.filter = `blur(${stepBlur}px)`;
        ctx.fillRect(x, y, w, h);
        ctx.filter = 'none';
        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;

    if (blurAmount > 0.3 && bloomIntensity > 0) {
      const bloomAlpha = (blurAmount - 0.3) * bloomIntensity;
      drawUtils.radialGlow(ctx, 0, 0, width * 0.3, colorUtils.lerpColor(blurColor, '#ffffff', 0.2), bloomAlpha * 0.15);
      drawUtils.multiLayerGlow(ctx, 0, 0, colorUtils.lerpColor(blurColor, '#ffffff', 0.3), width * 0.1, 3);
    }

    if (blurAmount > 0.4) {
      const vignetteAlpha = (blurAmount - 0.4) * 1.6;
      drawUtils.vignette(ctx, width, height, 0.5 * vignetteAlpha);
    }

    if (blurAmount > 0.2) {
      drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, blurAmount * 0.012, time);
    }
  },

  initParams: () => ({
    blurColor: '#0a0a1a',
    maxBlur: 25,
    bloomIntensity: 0.4,
    direction: 'center'
  })
};
