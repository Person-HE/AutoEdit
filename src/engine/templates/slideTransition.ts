import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const slideTransitionTemplate: TemplateDefinition = {
  id: 'transition_slide',
  name: '滑动转场',
  description: '带有运动模糊效果的滑动转场',
  category: 'transition',
  schema: [
    { key: 'slideColor', label: '滑块颜色', type: 'color', default: '#0a0a1a' },
    { key: 'direction', label: '滑动方向', type: 'select', default: 'left', options: [{ label: '从左到右', value: 'left' }, { label: '从右到左', value: 'right' }, { label: '从上到下', value: 'top' }, { label: '从下到上', value: 'bottom' }] },
    { key: 'motionBlur', label: '运动模糊', type: 'number', default: 20, min: 0, max: 50, step: 5 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const slideColor = paramGuard.color(params.slideColor, '#0a0a1a');
    const direction = params.direction || 'left';
    const motionBlur = paramGuard.number(params.motionBlur, 20, 0, 50);
    const p = paramGuard.number(progress, 0, 0, 1);

    let slideProgress: number;
    if (p < 0.5) {
      slideProgress = easing.easeInOutCubic(p * 2);
    } else {
      slideProgress = easing.easeInOutCubic(1 - (p - 0.5) * 2);
    }

    const slideGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [slideColor, colorUtils.lerpColor(slideColor, '#1a1a3e', 0.2), slideColor], direction === 'left' || direction === 'right' ? 90 : 180);

    let x = 0, y = 0, w = width, h = height;
    if (direction === 'left') {
      w = width * slideProgress;
      x = -width / 2;
    } else if (direction === 'right') {
      w = width * slideProgress;
      x = width / 2 - w;
    } else if (direction === 'top') {
      h = height * slideProgress;
      y = -height / 2;
    } else {
      h = height * slideProgress;
      y = height / 2 - h;
    }

    ctx.save();
    if (motionBlur > 0 && slideProgress > 0.1) {
      const blurAmount = motionBlur * slideProgress;
      if (direction === 'left' || direction === 'right') {
        ctx.filter = `blur(${blurAmount * 0.3}px)`;
      } else {
        ctx.filter = `blur(${blurAmount * 0.3}px)`;
      }
    }
    ctx.fillStyle = slideGrad;
    ctx.fillRect(x, y, w, h);
    ctx.filter = 'none';
    ctx.restore();

    if (slideProgress > 0.1) {
      const edgeX = direction === 'left' ? -width / 2 + w : direction === 'right' ? width / 2 - w : 0;
      const edgeY = direction === 'top' ? -height / 2 + h : direction === 'bottom' ? height / 2 - h : 0;
      const edgeColor = colorUtils.lerpColor(slideColor, '#ffffff', 0.3);
      drawUtils.lightBeam(ctx, edgeX, -height / 2, edgeX, height / 2, edgeColor, 0.15 * slideProgress, 3);
    }

    if (slideProgress > 0.3) {
      const vignetteAlpha = (slideProgress - 0.3) * 1.4;
      drawUtils.vignette(ctx, width, height, 0.4 * vignetteAlpha);
    }

    if (slideProgress > 0.2) {
      drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, slideProgress * 0.015, time);
    }
  },

  initParams: () => ({
    slideColor: '#0a0a1a',
    direction: 'left',
    motionBlur: 20
  })
};
