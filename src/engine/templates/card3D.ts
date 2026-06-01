import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const card3DTemplate: TemplateDefinition = {
  id: 'ui_card_3d',
  name: '3D卡片',
  description: '带有3D透视倾斜、浮动动画和发光效果的立体卡片',
  category: 'ui',
  schema: [
    { key: 'title', label: '标题', type: 'string', default: '3D CARD', placeholder: '输入卡片标题' },
    { key: 'subtitle', label: '副标题', type: 'string', default: 'Interactive Design', placeholder: '输入副标题' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0f0f23' },
    { key: 'cardColor', label: '卡片颜色', type: 'color', default: '#1a1a3e' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'tiltAmount', label: '倾斜程度', type: 'number', default: 15, min: 0, max: 30, step: 1 },
    { key: 'floatSpeed', label: '浮动速度', type: 'number', default: 1.5, min: 0.5, max: 3, step: 0.1 },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 25, min: 10, max: 60, step: 5 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const { width: availWidth, height: availHeight } = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const title = paramGuard.string(params.title, '3D CARD');
    const subtitle = paramGuard.string(params.subtitle, 'Interactive Design');
    const bgColor = paramGuard.color(params.bgColor, '#0f0f23');
    const cardColor = paramGuard.color(params.cardColor, '#1a1a3e');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const tiltAmount = paramGuard.number(params.tiltAmount, 15, 0, 30);
    const floatSpeed = paramGuard.number(params.floatSpeed, 1.5, 0.5, 3);
    const glowIntensity = paramGuard.number(params.glowIntensity, 25, 10, 60);
    const p = paramGuard.number(progress, 0, 0, 1);
    const springEnter = easing.spring(p, 100, 15, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.royal, time * 0.15, 0.35);
    drawUtils.vignette(ctx, width, height, 0.45);
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.02, time);

    const cardWidth = Math.min(availWidth * 0.8, availHeight * 0.6);
    const cardHeight = cardWidth * 0.65;
    const cornerRadius = cardWidth * 0.06;

    const tiltOscX = easing.dampedOscillation(time * floatSpeed * 0.3, 1.2, 0.08);
    const tiltOscY = easing.dampedOscillation(time * floatSpeed * 0.3 + 1.5, 0.9, 0.08);
    const tiltX = tiltOscX * tiltAmount * springEnter;
    const tiltY = tiltOscY * tiltAmount * 0.5 * springEnter;
    const floatOsc = easing.dampedOscillation(time * floatSpeed * 0.5, 0.8, 0.05);
    const floatY = floatOsc * 15 * springEnter;

    ctx.save();
    ctx.translate(0, floatY);

    const shadowOffsetX = -tiltX * 0.5;
    const shadowOffsetY = 20 + Math.abs(floatY) * 0.5;
    const shadowBlur = 40 + Math.abs(tiltX);
    ctx.save();
    ctx.translate(shadowOffsetX, shadowOffsetY);
    ctx.fillStyle = colorUtils.toRgba('#000000', 0.5);
    ctx.filter = `blur(${shadowBlur}px)`;
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const scaleX = 1 - Math.abs(tiltY) / 200;
    const scaleY = 1 - Math.abs(tiltX) / 200;
    ctx.scale(scaleX, scaleY);
    ctx.rotate((tiltX * Math.PI) / 180 * 0.1);

    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, cardWidth * 0.4, 5);

    const cardGrad = drawUtils.premiumGradient(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, [colorUtils.adjustBrightness(cardColor, 30), cardColor, colorUtils.adjustBrightness(cardColor, -25), colorUtils.lerpColor(cardColor, accentColor, 0.08)], 135);
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
    ctx.fillStyle = cardGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius, 0.06, colorUtils.toRgba(accentColor, 0.1));
    drawUtils.specularHighlight(ctx, -cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight, cornerRadius * 0.9, 0.25);

    const shimmerProgress = (time * 0.25) % 1;
    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
    ctx.clip();
    drawUtils.shimmerLine(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, shimmerProgress, accentColor, 0.12);
    ctx.restore();

    const padding = cardWidth * 0.08;
    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2 + padding, -cardHeight / 2 + padding, cardWidth - padding * 2, cardHeight - padding * 2, cornerRadius * 0.6);
    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
    const lineY = -cardHeight / 2 + padding * 2.5;
    ctx.beginPath();
    ctx.moveTo(-cardWidth / 2 + padding * 2, lineY);
    ctx.lineTo(cardWidth / 2 - padding * 2, lineY);
    ctx.stroke();
    ctx.restore();

    const titleFontSize = adaptiveLayout.calculateFontSize(ctx, title, cardWidth * 0.7, cardHeight * 0.25);
    ctx.save();
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawUtils.gradientText(ctx, title, 0, -cardHeight * 0.1, [accentColor, '#ffffff', accentColor], 90);
    ctx.restore();

    const subtitleFontSize = titleFontSize * 0.4;
    ctx.save();
    ctx.fillStyle = colorUtils.toRgba(textColor, 0.7);
    ctx.font = `${subtitleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(subtitle, 0, cardHeight * 0.15);
    ctx.restore();

    ctx.save();
    const dotCount = 5;
    const dotSpacing = cardWidth * 0.06;
    const totalWidth = (dotCount - 1) * dotSpacing;
    const dotY = cardHeight * 0.35;
    for (let i = 0; i < dotCount; i++) {
      const dotX = -totalWidth / 2 + i * dotSpacing;
      const dotOsc = easing.dampedOscillation(time * 2 + i * 0.8, 1.5, 0.12);
      const dotSize = cardWidth * 0.015 * (0.8 + Math.abs(dotOsc) * 0.6);
      drawUtils.particle(ctx, dotX, dotY, dotSize * 3, i === 2 ? accentColor : colorUtils.lerpColor(accentColor, '#ffffff', 0.3), i === 2 ? 0.8 : 0.4, 0.6);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.6);
    ctx.lineWidth = 2;
    const cornerSize = cardWidth * 0.08;
    ctx.beginPath();
    ctx.moveTo(-cardWidth / 2 + padding, -cardHeight / 2 + padding + cornerSize);
    ctx.lineTo(-cardWidth / 2 + padding, -cardHeight / 2 + padding);
    ctx.lineTo(-cardWidth / 2 + padding + cornerSize, -cardHeight / 2 + padding);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cardWidth / 2 - padding, cardHeight / 2 - padding - cornerSize);
    ctx.lineTo(cardWidth / 2 - padding, cardHeight / 2 - padding);
    ctx.lineTo(cardWidth / 2 - padding - cornerSize, cardHeight / 2 - padding);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
    ctx.restore();
  },

  initParams: () => ({
    title: '3D CARD',
    subtitle: 'Interactive Design',
    bgColor: '#0f0f23',
    cardColor: '#1a1a3e',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    tiltAmount: 15,
    floatSpeed: 1.5,
    glowIntensity: 25
  })
};
