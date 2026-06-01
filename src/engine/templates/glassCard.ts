import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const chars = text.split('');
  const lines: string[] = [];
  let currentLine = '';
  for (const char of chars) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

export const glassCardTemplate: TemplateDefinition = {
  id: 'ui_glass_card',
  name: '玻璃卡片',
  description: '毛玻璃效果卡片，带有折射和发光效果',
  category: 'ui',
  schema: [
    { key: 'title', label: '标题', type: 'string', default: 'Glass Card', placeholder: '输入卡片标题' },
    { key: 'content', label: '内容', type: 'textarea', default: '毛玻璃效果带来现代感十足的视觉体验', placeholder: '输入卡片内容' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0f0f23' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'glassOpacity', label: '玻璃透明度', type: 'number', default: 0.15, min: 0.05, max: 0.4, step: 0.05 },
    { key: 'blurAmount', label: '模糊程度', type: 'number', default: 20, min: 5, max: 50, step: 5 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const title = paramGuard.string(params.title, 'Glass Card');
    const content = paramGuard.string(params.content, '毛玻璃效果带来现代感十足的视觉体验');
    const bgColor = paramGuard.color(params.bgColor, '#0f0f23');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const glassOpacity = paramGuard.number(params.glassOpacity, 0.15, 0.05, 0.4);
    const blurAmount = paramGuard.number(params.blurAmount, 20, 5, 50);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.35);
    const enterSpring = easing.spring(enterProgress, 100, 14, 1);
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitEased = easing.easeInCubic(exitProgress);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.dream, time * 0.2, 0.35);
    drawUtils.vignette(ctx, width, height, 0.4);

    const cardWidth = Math.min(availSize.width * 0.85, 600);
    const cardHeight = Math.min(availSize.height * 0.7, 400);
    const cornerRadius = 24;

    const floatOsc = easing.dampedOscillation(time * 0.8, 0.6, 0.04);
    const floatY = floatOsc * 10 * enterSpring * (1 - exitEased);
    const tiltOsc = easing.dampedOscillation(time * 0.6, 0.4, 0.04);
    const rotateX = tiltOsc * 3 * enterSpring * (1 - exitEased);

    ctx.save();
    ctx.translate(0, floatY);
    ctx.rotate(rotateX * Math.PI / 180);
    ctx.scale(enterSpring * (1 - exitEased * 0.2), enterSpring * (1 - exitEased * 0.2));

    ctx.save();
    ctx.fillStyle = colorUtils.toRgba('#000000', 0.3);
    ctx.filter = 'blur(30px)';
    drawUtils.roundedRect(ctx, -cardWidth / 2 + 12, -cardHeight / 2 + 12, cardWidth, cardHeight, cornerRadius);
    ctx.fill();
    ctx.restore();

    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, cardWidth * 0.35, 5);

    drawUtils.glassBackground(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius, glassOpacity * enterSpring, colorUtils.toRgba(accentColor, 0.2));

    const innerGrad = drawUtils.premiumGradient(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, [colorUtils.toRgba('#ffffff', glassOpacity * 0.8), colorUtils.toRgba('#ffffff', glassOpacity * 0.3), colorUtils.toRgba(accentColor, glassOpacity * 0.2)], 135);
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
    ctx.fillStyle = innerGrad;
    ctx.fill();

    drawUtils.specularHighlight(ctx, -cardWidth / 2 + 6, -cardHeight / 2 + 6, cardWidth - 12, cardHeight, cornerRadius * 0.9, 0.25);

    const shimmerProgress = (time * 0.2) % 1;
    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
    ctx.clip();
    drawUtils.shimmerLine(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, shimmerProgress, accentColor, 0.12);
    ctx.restore();

    const beamProgress = (time * 0.3) % 1;
    drawUtils.borderBeam(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius, beamProgress, accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), 70);

    const titleFontSize = adaptiveLayout.calculateFontSize(ctx, title, cardWidth * 0.85, cardHeight * 0.25);
    ctx.save();
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    drawUtils.gradientText(ctx, title, -cardWidth / 2 + 30, -cardHeight / 2 + 30, [accentColor, '#ffffff'], 90);
    ctx.restore();

    const contentFontSize = Math.max(14, titleFontSize * 0.4);
    ctx.fillStyle = colorUtils.toRgba('#ffffff', 0.8);
    ctx.font = `${contentFontSize}px Arial, sans-serif`;
    const maxContentWidth = cardWidth - 60;
    const lineHeight = contentFontSize * 1.5;
    const lines = wrapText(ctx, content, maxContentWidth);
    lines.slice(0, 4).forEach((line, index) => {
      ctx.fillText(line, -cardWidth / 2 + 30, -cardHeight / 2 + 30 + titleFontSize + 20 + index * lineHeight);
    });

    const decorSize = 60;
    const decorX = cardWidth / 2 - decorSize - 20;
    const decorY = -cardHeight / 2 + 20;
    drawUtils.particle(ctx, decorX + decorSize / 2, decorY + decorSize / 2, decorSize / 2, accentColor, 0.3, 0.5);
    drawUtils.radialGlow(ctx, decorX + decorSize / 2, decorY + decorSize / 2, decorSize, accentColor, 0.5);

    ctx.restore();
  },

  initParams: (duration: number) => ({
    title: 'Glass Card',
    content: '毛玻璃效果带来现代感十足的视觉体验',
    bgColor: '#0f0f23',
    accentColor: '#00d4ff',
    glassOpacity: 0.15,
    blurAmount: 20
  })
};
