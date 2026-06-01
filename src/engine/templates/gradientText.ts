import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

export const gradientTextTemplate: TemplateDefinition = {
  id: 'text_gradient',
  name: '渐变文字',
  description: '带有流光渐变效果的文字动画',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'GRADIENT',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'startColor',
      label: '起始颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'endColor',
      label: '结束颜色',
      type: 'color',
      default: '#ff00d4'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'flowSpeed',
      label: '流动速度',
      type: 'number',
      default: 2,
      min: 0.5,
      max: 5,
      step: 0.5
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 30,
      min: 10,
      max: 80,
      step: 5
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const text = paramGuard.string(params.text, 'GRADIENT');
    const startColor = paramGuard.color(params.startColor, '#00d4ff');
    const endColor = paramGuard.color(params.endColor, '#ff00d4');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const flowSpeed = paramGuard.number(params.flowSpeed, 2, 0.5, 5);
    const glowIntensity = paramGuard.number(params.glowIntensity, 30, 10, 80);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availSize.width, availSize.height
    );

    ctx.save();
    ctx.fillStyle = '#060610';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    const bgPal = [startColor, colorUtils.lerpColor(startColor, endColor, 0.5), endColor];
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, bgPal, time * 0.3, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    const microBounce = easing.perlinNoise1D(time * 1.2, 1, 0) * 0.015 * (1 - p);

    const enterProgress = Math.min(1, p / 0.35);
    const enterScale = easing.spring(enterProgress, 160, 14, 1);

    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitAlpha = 1 - easing.easeInCubic(exitProgress);

    const finalScale = enterScale * (1 + microBounce);

    ctx.save();
    ctx.scale(finalScale, finalScale);

    const flowOffset = time * flowSpeed * 0.5;
    const gradientShift = easing.perlinNoise1D(flowOffset * 0.3, 1.5, 0) * 0.6 - 0.3;

    const midColor = colorUtils.lerpColor(startColor, endColor, 0.5);
    const gradColors = [
      startColor,
      colorUtils.lerpColor(startColor, midColor, 0.3 + gradientShift * 0.3),
      midColor,
      colorUtils.lerpColor(midColor, endColor, 0.3 + gradientShift * 0.3),
      endColor,
    ];

    drawUtils.multiLayerGlow(ctx, 0, 0, glowColor, fontSize * 1.2, 5);

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowIntensity * eased * 0.8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = fontSize * 0.04;

    const flowAngle = 135 + Math.sin(time * flowSpeed * 0.3) * 30;
    drawUtils.gradientText(ctx, text, 0, 0, gradColors, flowAngle);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = eased * exitAlpha * 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, -1);
    ctx.restore();

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const shimmerP = (time * flowSpeed * 0.15) % 1;
    drawUtils.shimmerLine(ctx, -fontSize * text.length * 0.35, -fontSize * 0.5, fontSize * text.length * 0.7, fontSize, shimmerP, '#ffffff', 0.35 * eased * exitAlpha);

    ctx.restore();

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const borderProgress = (time * 0.5) % 1;
    const textMetrics = ctx.measureText(text);
    const textW = textMetrics.width;
    const textH = fontSize;
    const padX = textW * 0.15;
    const padY = textH * 0.3;
    drawUtils.borderBeam(ctx, -textW / 2 - padX, -textH / 2 - padY, textW + padX * 2, textH + padY * 2, 12, borderProgress, startColor, endColor, 50);

    ctx.restore();

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = colorUtils.lerpColor(startColor, endColor, 0.5);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.25 * eased * exitAlpha;
    ctx.strokeText(text, 0, 0);
    ctx.restore();

    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'GRADIENT',
    startColor: '#00d4ff',
    endColor: '#ff00d4',
    glowColor: '#00d4ff',
    flowSpeed: 2,
    glowIntensity: 30
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
