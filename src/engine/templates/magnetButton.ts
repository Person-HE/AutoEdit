import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const magnetButtonTemplate: TemplateDefinition = {
  id: 'ui_magnet_button',
  name: '磁性按钮',
  description: '带有磁性吸引效果的按钮，鼠标靠近时产生吸引动画',
  category: 'ui',
  schema: [
    { key: 'label', label: '按钮文字', type: 'string', default: '点击我', placeholder: '输入按钮文字' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a1a2e' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'magnetStrength', label: '磁性强度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 30, min: 10, max: 80, step: 5 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const label = paramGuard.string(params.label, '点击我');
    const bgColor = paramGuard.color(params.bgColor, '#1a1a2e');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const magnetStrength = paramGuard.number(params.magnetStrength, 1, 0.5, 2);
    const glowIntensity = paramGuard.number(params.glowIntensity, 30, 10, 80);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.3);
    const enterSpring = easing.spring(enterProgress, 120, 14, 1);
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitEased = easing.easeInCubic(exitProgress);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.cyberpunk, time * 0.12, 0.2);
    drawUtils.vignette(ctx, width, height, 0.4);

    const buttonWidth = Math.min(availSize.width * 0.6, 400);
    const buttonHeight = Math.min(availSize.height * 0.25, 100);
    const cornerRadius = buttonHeight * 0.25;

    const magnetPhase = (time * 1.5) % 1;
    const magnetOscX = easing.dampedOscillation(magnetPhase, 1.5, 0.12);
    const magnetOscY = easing.dampedOscillation(magnetPhase + 0.5, 1.2, 0.12);
    const magnetOffsetX = magnetOscX * 18 * magnetStrength * enterSpring * (1 - exitEased);
    const magnetOffsetY = magnetOscY * 9 * magnetStrength * enterSpring * (1 - exitEased);

    const scaleSpring = easing.spring(enterProgress, 90, 12, 1);
    const scalePulse = 1 + easing.dampedOscillation(time * 2, 2, 0.1) * 0.02 * enterSpring * (1 - exitEased);
    const currentScale = scaleSpring * scalePulse * (1 - exitEased * 0.3);

    ctx.save();
    ctx.translate(magnetOffsetX, magnetOffsetY);
    ctx.scale(currentScale, currentScale);

    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, buttonWidth * 0.25, 5);

    const bgGrad = drawUtils.premiumGradient(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, [colorUtils.adjustBrightness(bgColor, 25), bgColor, colorUtils.adjustBrightness(bgColor, -25), colorUtils.lerpColor(bgColor, accentColor, 0.12)], 135);
    drawUtils.roundedRect(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius, 0.08, colorUtils.toRgba(accentColor, 0.12));
    drawUtils.specularHighlight(ctx, -buttonWidth / 2 + 3, -buttonHeight / 2 + 3, buttonWidth - 6, buttonHeight, cornerRadius * 0.8, 0.2);

    drawUtils.radialGlow(ctx, 0, -buttonHeight / 4, buttonWidth / 2, accentColor, 0.15);

    const shimmerProgress = (time * 0.25) % 1;
    ctx.save();
    drawUtils.roundedRect(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    ctx.clip();
    drawUtils.shimmerLine(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, shimmerProgress, accentColor, 0.12);
    ctx.restore();

    const trailCount = 5;
    for (let i = 1; i <= trailCount; i++) {
      const trailPhase = (time * 1.5 - i * 0.08) % 1;
      const trailOscX = easing.dampedOscillation(trailPhase, 1.5, 0.12);
      const trailX = trailOscX * 18 * magnetStrength * enterSpring * (1 - exitEased);
      const trailAlpha = (1 - i / trailCount) * 0.15;
      ctx.save();
      ctx.globalAlpha = trailAlpha;
      ctx.translate(trailX - magnetOffsetX, 0);
      drawUtils.roundedRect(ctx, -buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    const fontSize = adaptiveLayout.calculateFontSize(ctx, label, buttonWidth * 0.8, buttonHeight * 0.6);
    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = enterSpring * (1 - exitEased);
    drawUtils.gradientText(ctx, label, 0, 0, [textColor, accentColor], 90);
    ctx.restore();

    ctx.restore();
  },

  initParams: (duration: number) => ({
    label: '点击我',
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    magnetStrength: 1,
    glowIntensity: 30
  })
};
