import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const zoomTransitionTemplate: TemplateDefinition = {
  id: 'transition_zoom',
  name: '缩放转场',
  description: '带有径向模糊效果的缩放转场',
  category: 'transition',
  schema: [
    { key: 'zoomColor', label: '缩放颜色', type: 'color', default: '#0a0a1a' },
    { key: 'zoomIntensity', label: '缩放强度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 },
    { key: 'radialBlur', label: '径向模糊', type: 'number', default: 20, min: 0, max: 50, step: 5 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const zoomColor = paramGuard.color(params.zoomColor, '#0a0a1a');
    const zoomIntensity = paramGuard.number(params.zoomIntensity, 1, 0.5, 2);
    const radialBlur = paramGuard.number(params.radialBlur, 20, 0, 50);
    const p = paramGuard.number(progress, 0, 0, 1);

    let zoomProgress: number;
    if (p < 0.5) {
      zoomProgress = easing.easeInOutCubic(p * 2);
    } else {
      zoomProgress = easing.easeInOutCubic(1 - (p - 0.5) * 2);
    }

    const overlayGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [zoomColor, colorUtils.lerpColor(zoomColor, '#1a1a3e', 0.15), zoomColor], 135);
    ctx.fillStyle = overlayGrad;
    ctx.globalAlpha = zoomProgress;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.globalAlpha = 1;

    if (zoomProgress > 0.2) {
      const centerAlpha = zoomProgress * 0.3;
      drawUtils.radialGlow(ctx, 0, 0, width * 0.3 * zoomProgress, colorUtils.lerpColor(zoomColor, '#ffffff', 0.2), centerAlpha);
      drawUtils.multiLayerGlow(ctx, 0, 0, colorUtils.lerpColor(zoomColor, '#ffffff', 0.3), width * 0.1 * zoomProgress, 3);
    }

    if (radialBlur > 0 && zoomProgress > 0.1) {
      const lineCount = 16;
      const lineLength = radialBlur * zoomProgress * zoomIntensity;
      const lineColor = colorUtils.lerpColor(zoomColor, '#ffffff', 0.2);
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const innerR = width * 0.1;
        const outerR = innerR + lineLength;
        const lineAlpha = zoomProgress * 0.15;
        ctx.save();
        ctx.strokeStyle = colorUtils.toRgba(lineColor, lineAlpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (zoomProgress > 0.3) {
      const vignetteAlpha = (zoomProgress - 0.3) * 1.4;
      drawUtils.vignette(ctx, width, height, 0.6 * vignetteAlpha);
    }

    if (zoomProgress > 0.2) {
      drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, zoomProgress * 0.015, time);
    }
  },

  initParams: () => ({
    zoomColor: '#0a0a1a',
    zoomIntensity: 1,
    radialBlur: 20
  })
};
