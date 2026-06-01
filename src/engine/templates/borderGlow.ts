import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const borderGlowTemplate: TemplateDefinition = {
  id: 'ui_border_glow',
  name: '发光边框',
  description: '多层发光边框效果，带有动态光束和脉冲动画',
  category: 'ui',
  schema: [
    { key: 'title', label: '标题', type: 'string', default: 'GLOW', placeholder: '输入标题' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
    { key: 'cardColor', label: '卡片颜色', type: 'color', default: '#111122' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'glowColor', label: '发光颜色', type: 'color', default: '#00d4ff' },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 40, min: 10, max: 80, step: 5 },
    { key: 'cornerRadius', label: '圆角大小', type: 'number', default: 20, min: 0, max: 50, step: 2 },
    { key: 'pulseSpeed', label: '脉冲速度', type: 'number', default: 1.5, min: 0.5, max: 3, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const title = paramGuard.string(params.title, 'GLOW');
    const bgColor = paramGuard.color(params.bgColor, '#0a0a1a');
    const cardColor = paramGuard.color(params.cardColor, '#111122');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const glowIntensity = paramGuard.number(params.glowIntensity, 40, 10, 80);
    const cornerRadius = paramGuard.number(params.cornerRadius, 20, 0, 50);
    const pulseSpeed = paramGuard.number(params.pulseSpeed, 1.5, 0.5, 3);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.35);
    const enterSpring = easing.spring(enterProgress, 100, 14, 1);
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitEased = easing.easeInCubic(exitProgress);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.cyberpunk, time * 0.1, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const cardWidth = Math.min(availSize.width * 0.8, 500);
    const cardHeight = Math.min(availSize.height * 0.6, 300);
    const radius = Math.min(cornerRadius, cardWidth * 0.08);

    ctx.save();
    ctx.scale(enterSpring * (1 - exitEased * 0.2), enterSpring * (1 - exitEased * 0.2));

    const pulsePhase = easing.dampedOscillation(time * pulseSpeed, 2, 0.15);
    const glowPulse = 1 + Math.abs(pulsePhase) * 0.3;

    drawUtils.multiLayerGlow(ctx, 0, 0, glowColor, cardWidth * 0.35 * glowPulse, 5);

    for (let layer = 3; layer >= 1; layer--) {
      const expand = layer * 4 * glowPulse;
      const alpha = 0.15 / layer;
      ctx.save();
      drawUtils.roundedRect(ctx, -cardWidth / 2 - expand, -cardHeight / 2 - expand, cardWidth + expand * 2, cardHeight + expand * 2, radius + expand * 0.5);
      ctx.strokeStyle = colorUtils.toRgba(glowColor, alpha);
      ctx.lineWidth = 2 * layer;
      ctx.stroke();
      ctx.restore();
    }

    const cardGrad = drawUtils.premiumGradient(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, [colorUtils.adjustBrightness(cardColor, 20), cardColor, colorUtils.adjustBrightness(cardColor, -15)], 135);
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.fillStyle = cardGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius, 0.06, colorUtils.toRgba(glowColor, 0.08));
    drawUtils.specularHighlight(ctx, -cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight, radius * 0.8, 0.18);

    const beamProgress = (time * 0.3) % 1;
    drawUtils.borderBeam(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius, beamProgress, glowColor, colorUtils.lerpColor(glowColor, '#ff00e5', 0.5), 80);

    const shimmerProgress = (time * 0.2) % 1;
    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, radius);
    ctx.clip();
    drawUtils.shimmerLine(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, shimmerProgress, glowColor, 0.1);
    ctx.restore();

    const titleFontSize = adaptiveLayout.calculateFontSize(ctx, title, cardWidth * 0.7, cardHeight * 0.3);
    ctx.save();
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawUtils.neonText(ctx, title, 0, 0, glowColor, 0.8);
    ctx.restore();

    const cornerSize = cardWidth * 0.06;
    const padding = cardWidth * 0.04;
    ctx.save();
    ctx.strokeStyle = colorUtils.toRgba(glowColor, 0.6);
    ctx.lineWidth = 2;
    const corners = [
      { x: -cardWidth / 2 + padding, y: -cardHeight / 2 + padding, dx: 1, dy: 1 },
      { x: cardWidth / 2 - padding, y: -cardHeight / 2 + padding, dx: -1, dy: 1 },
      { x: -cardWidth / 2 + padding, y: cardHeight / 2 - padding, dx: 1, dy: -1 },
      { x: cardWidth / 2 - padding, y: cardHeight / 2 - padding, dx: -1, dy: -1 }
    ];
    corners.forEach(corner => {
      ctx.beginPath();
      ctx.moveTo(corner.x + cornerSize * corner.dx, corner.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(corner.x, corner.y + cornerSize * corner.dy);
      ctx.stroke();
    });
    ctx.restore();

    ctx.restore();
  },

  initParams: () => ({
    title: 'GLOW',
    bgColor: '#0a0a1a',
    cardColor: '#111122',
    textColor: '#ffffff',
    glowColor: '#00d4ff',
    glowIntensity: 40,
    cornerRadius: 20,
    pulseSpeed: 1.5
  })
};
