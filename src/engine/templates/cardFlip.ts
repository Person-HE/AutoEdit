import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const cardFlipTemplate: TemplateDefinition = {
  id: 'ui_card_flip',
  name: '卡片翻转',
  description: '3D翻转卡片动画，支持正反面内容和发光边框效果',
  category: 'ui',
  schema: [
    { key: 'frontText', label: '正面文字', type: 'string', default: 'FRONT', placeholder: '正面显示内容' },
    { key: 'backText', label: '背面文字', type: 'string', default: 'BACK', placeholder: '背面显示内容' },
    { key: 'frontColor', label: '正面颜色', type: 'color', default: '#1a1a2e' },
    { key: 'backColor', label: '背面颜色', type: 'color', default: '#16213e' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'cornerRadius', label: '圆角大小', type: 'number', default: 20, min: 0, max: 50, step: 2 },
    { key: 'flipDirection', label: '翻转方向', type: 'select', default: 'horizontal', options: [{ label: '水平翻转', value: 'horizontal' }, { label: '垂直翻转', value: 'vertical' }] }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const { width: availWidth, height: availHeight } = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const frontText = paramGuard.string(params.frontText, 'FRONT');
    const backText = paramGuard.string(params.backText, 'BACK');
    const frontColor = paramGuard.color(params.frontColor, '#1a1a2e');
    const backColor = paramGuard.color(params.backColor, '#16213e');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const cornerRadius = paramGuard.number(params.cornerRadius, 20, 0, 50);
    const flipDirection = params.flipDirection === 'vertical' ? 'vertical' : 'horizontal';
    const p = paramGuard.number(progress, 0, 0, 1);

    const springFlip = easing.spring(p, 120, 14, 1);
    const settleOscillation = easing.dampedOscillation(p, 2.5, 0.25);
    const flipAngle = springFlip * Math.PI;

    const cardSize = Math.min(availWidth, availHeight) * 0.85;
    const cardWidth = cardSize;
    const cardHeight = cardSize * 1.3;
    const radius = Math.min(cornerRadius, cardWidth * 0.1);

    ctx.save();

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.galaxy, time * 0.2, 0.4);
    drawUtils.vignette(ctx, width, height, 0.5);

    const isFront = Math.cos(flipAngle) >= 0;
    const shadowOffset = Math.sin(flipAngle) * 20;
    const shadowOscillation = settleOscillation * 5;
    const shadowBlur = 30 + Math.abs(Math.sin(flipAngle)) * 20 + Math.abs(shadowOscillation) * 3;
    const shadowAlpha = 0.3 + Math.abs(Math.sin(flipAngle)) * 0.2;

    ctx.save();
    ctx.translate(shadowOscillation, cardHeight * 0.1);
    ctx.fillStyle = colorUtils.toRgba('#000000', shadowAlpha);
    ctx.filter = `blur(${shadowBlur}px)`;
    drawUtils.roundedRect(ctx, -cardWidth / 2 + shadowOffset, -cardHeight / 2 + shadowOffset, cardWidth, cardHeight, radius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    if (flipDirection === 'horizontal') {
      ctx.scale(Math.cos(flipAngle), 1);
    } else {
      ctx.scale(1, Math.cos(flipAngle));
    }

    const beamProgress = (time * 0.4) % 1;
    drawUtils.borderBeam(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius, beamProgress, accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), 80);

    const glowPulse = easing.dampedOscillation(p, 4, 0.2);
    const glowIntensity = 25 * (1 - Math.abs(Math.sin(flipAngle))) + Math.abs(glowPulse) * 15;
    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, Math.min(cardWidth, cardHeight) * 0.6, 5);

    const currentColor = isFront ? frontColor : backColor;
    const cardGrad = drawUtils.premiumGradient(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, [colorUtils.adjustBrightness(currentColor, 25), currentColor, colorUtils.adjustBrightness(currentColor, -20), colorUtils.lerpColor(currentColor, accentColor, 0.1)], 135);
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.fillStyle = cardGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius, 0.08, colorUtils.toRgba(accentColor, 0.15));
    drawUtils.specularHighlight(ctx, -cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight, radius * 0.9, 0.2);

    const shimmerProgress = (time * 0.3) % 1;
    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.clip();
    drawUtils.shimmerLine(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, shimmerProgress, accentColor, 0.15);
    ctx.restore();

    ctx.save();
    const padding = cardWidth * 0.08;
    drawUtils.roundedRect(ctx, -cardWidth / 2 + padding, -cardHeight / 2 + padding, cardWidth - padding * 2, cardHeight - padding * 2, radius * 0.5);
    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    const currentText = isFront ? frontText : backText;
    const fontSize = adaptiveLayout.calculateFontSize(ctx, currentText, cardWidth * 0.7, cardHeight * 0.3);

    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.clip();
    drawUtils.neonText(ctx, currentText, 0, 0, accentColor, 0.8);
    ctx.restore();

    ctx.save();
    const iconSize = cardWidth * 0.15;
    const iconY = -cardHeight * 0.25;
    const iconOscillation = easing.dampedOscillation(p, 5, 0.3);
    const iconScale = 1 + iconOscillation * 0.1;
    ctx.translate(0, iconY);
    ctx.scale(iconScale, iconScale);
    if (isFront) {
      drawUtils.particle(ctx, 0, 0, iconSize, accentColor, 0.4, 0.6);
    } else {
      drawUtils.particle(ctx, 0, 0, iconSize * 0.6, accentColor, 0.5, 0.5);
    }
    ctx.restore();

    ctx.save();
    const hintFontSize = fontSize * 0.3;
    ctx.fillStyle = colorUtils.toRgba(textColor, 0.5);
    ctx.font = `${hintFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(isFront ? '正面' : '背面', 0, cardHeight / 2 - padding * 2);
    ctx.restore();

    ctx.restore();
    ctx.restore();
  },

  initParams: () => ({
    frontText: 'FRONT',
    backText: 'BACK',
    frontColor: '#1a1a2e',
    backColor: '#16213e',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    cornerRadius: 20,
    flipDirection: 'horizontal'
  })
};
