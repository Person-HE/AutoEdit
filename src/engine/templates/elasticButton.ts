import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const elasticButtonTemplate: TemplateDefinition = {
  id: 'ui_elastic_button',
  name: '弹性按钮',
  description: '带有弹性动画和发光效果的交互式按钮，支持点击反馈',
  category: 'ui',
  schema: [
    { key: 'label', label: '按钮文字', type: 'string', default: 'CLICK ME', placeholder: '输入按钮文字' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a1a2e' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色/发光色', type: 'color', default: '#00d4ff' },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 30, min: 10, max: 80, step: 5 },
    { key: 'cornerRadius', label: '圆角大小', type: 'number', default: 16, min: 0, max: 50, step: 2 },
    { key: 'pulseSpeed', label: '脉冲速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const { width: availWidth, height: availHeight } = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const label = paramGuard.string(params.label, 'CLICK ME');
    const bgColor = paramGuard.color(params.bgColor, '#1a1a2e');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const glowIntensity = paramGuard.number(params.glowIntensity, 30, 10, 80);
    const cornerRadius = paramGuard.number(params.cornerRadius, 16, 0, 50);
    const pulseSpeed = paramGuard.number(params.pulseSpeed, 2, 0.5, 5);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.4);
    const snapEnter = easing.snapSpring(enterProgress, 350, 30);
    const holdPhase = p > 0.4 && p < 0.7;
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitScale = 1 - easing.easeInCubic(exitProgress) * 0.3;

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.royal, time * 0.1, 0.25);
    drawUtils.vignette(ctx, width, height, 0.4);

    const buttonWidth = availWidth * 0.8;
    const buttonHeight = Math.min(availHeight * 0.5, buttonWidth * 0.25);
    const radius = Math.min(cornerRadius, buttonHeight * 0.3);

    ctx.save();
    const finalScale = snapEnter * exitScale;
    ctx.scale(finalScale, finalScale);

    const breathe = easing.dampedOscillation(time * 2, 1.5, 0.1) * 0.015 * (1 - p);
    ctx.scale(1 + breathe, 1 + breathe);

    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, buttonWidth * 0.3, 5);

    const btnGrad = drawUtils.premiumGradient(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, [colorUtils.adjustBrightness(bgColor, 30), bgColor, colorUtils.adjustBrightness(bgColor, -25), colorUtils.lerpColor(bgColor, accentColor, 0.15)], 135);
    drawUtils.roundedRect(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, radius);
    ctx.fillStyle = btnGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, radius, 0.08, colorUtils.toRgba(accentColor, 0.1));
    drawUtils.specularHighlight(ctx, -buttonWidth / 2 + 3, -buttonHeight / 2 + 3, buttonWidth - 6, buttonHeight, radius * 0.8, 0.2);

    const shimmerProgress = (time * 0.3) % 1;
    ctx.save();
    drawUtils.roundedRect(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, radius);
    ctx.clip();
    drawUtils.shimmerLine(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, shimmerProgress, accentColor, 0.15);
    ctx.restore();

    const beamProgress = (time * 0.35) % 1;
    drawUtils.borderBeam(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, radius, beamProgress, accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), 60);

    const fontSize = adaptiveLayout.calculateFontSize(ctx, label, buttonWidth * 0.8, buttonHeight * 0.5);
    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawUtils.gradientText(ctx, label, 0, 0, [textColor, accentColor, textColor], 90);
    ctx.restore();

    if (holdPhase && p > 0.5) {
      const rippleProgress = (p - 0.5) / 0.2;
      const rippleSnap = easing.snapSpring(rippleProgress, 400, 32);
      const rippleScale = 1 + rippleSnap * 0.3;
      const rippleAlpha = 1 - rippleProgress;
      ctx.save();
      ctx.scale(rippleScale, rippleScale);
      ctx.strokeStyle = colorUtils.toRgba(accentColor, rippleAlpha * 0.5);
      ctx.lineWidth = 2;
      drawUtils.roundedRect(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, radius);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  },

  initParams: () => ({
    label: 'CLICK ME',
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    glowIntensity: 30,
    cornerRadius: 16,
    pulseSpeed: 2
  })
};
