import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const rotateTransitionTemplate: TemplateDefinition = {
  id: 'transition_rotate',
  name: '旋转转场',
  description: '带有3D透视效果的旋转转场',
  category: 'transition',
  schema: [
    { key: 'rotateColor', label: '旋转颜色', type: 'color', default: '#0a0a1a' },
    { key: 'rotationAngle', label: '旋转角度', type: 'number', default: 90, min: 45, max: 180, step: 15 },
    { key: 'perspective', label: '透视强度', type: 'number', default: 0.5, min: 0.2, max: 1, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const rotateColor = paramGuard.color(params.rotateColor, '#0a0a1a');
    const rotationAngle = paramGuard.number(params.rotationAngle, 90, 45, 180);
    const perspective = paramGuard.number(params.perspective, 0.5, 0.2, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    let rotateProgress: number;
    if (p < 0.5) {
      rotateProgress = easing.easeInOutCubic(p * 2);
    } else {
      rotateProgress = easing.easeInOutCubic(1 - (p - 0.5) * 2);
    }

    const angle = rotateProgress * rotationAngle * Math.PI / 180;
    const scaleX = Math.cos(angle);
    const absScale = Math.abs(scaleX);

    const overlayGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, [rotateColor, colorUtils.lerpColor(rotateColor, '#1a1a3e', 0.15), rotateColor], 135);

    ctx.save();
    ctx.scale(absScale * perspective + (1 - perspective), 1);
    ctx.fillStyle = overlayGrad;
    ctx.globalAlpha = rotateProgress;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();

    if (absScale < 0.3) {
      const edgeAlpha = (0.3 - absScale) / 0.3;
      const edgeColor = colorUtils.lerpColor(rotateColor, '#ffffff', 0.4);
      drawUtils.lightBeam(ctx, 0, -height / 2, 0, height / 2, edgeColor, edgeAlpha * 0.2, 5);
      drawUtils.multiLayerGlow(ctx, 0, 0, edgeColor, 30, 3);
    }

    if (rotateProgress > 0.3) {
      const vignetteAlpha = (rotateProgress - 0.3) * 1.4;
      drawUtils.vignette(ctx, width, height, 0.5 * vignetteAlpha);
    }

    if (rotateProgress > 0.2) {
      drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, rotateProgress * 0.015, time);
    }
  },

  initParams: () => ({
    rotateColor: '#0a0a1a',
    rotationAngle: 90,
    perspective: 0.5
  })
};
