import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const spotlightCardTemplate: TemplateDefinition = {
  id: 'ui_spotlight_card',
  name: '聚光灯卡片',
  description: '带有动态聚光灯扫过效果的卡片，边缘发光随灯光移动',
  category: 'ui',
  schema: [
    { key: 'title', label: '标题', type: 'string', default: 'SPOTLIGHT', placeholder: '输入卡片标题' },
    { key: 'description', label: '描述', type: 'string', default: 'Hover to reveal', placeholder: '输入描述文字' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a0a' },
    { key: 'cardColor', label: '卡片颜色', type: 'color', default: '#111111' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'spotlightColor', label: '聚光灯颜色', type: 'color', default: '#00d4ff' },
    { key: 'spotlightSize', label: '聚光灯大小', type: 'number', default: 150, min: 80, max: 300, step: 10 },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 40, min: 20, max: 80, step: 5 },
    { key: 'scanSpeed', label: '扫描速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const { width: availWidth, height: availHeight } = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const title = paramGuard.string(params.title, 'SPOTLIGHT');
    const description = paramGuard.string(params.description, 'Hover to reveal');
    const bgColor = paramGuard.color(params.bgColor, '#0a0a0a');
    const cardColor = paramGuard.color(params.cardColor, '#111111');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const spotlightColor = paramGuard.color(params.spotlightColor, '#00d4ff');
    const spotlightSize = paramGuard.number(params.spotlightSize, 150, 80, 300);
    const glowIntensity = paramGuard.number(params.glowIntensity, 40, 20, 80);
    const scanSpeed = paramGuard.number(params.scanSpeed, 1, 0.5, 3);
    const p = paramGuard.number(progress, 0, 0, 1);
    const springEnter = easing.spring(p, 100, 14, 1);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, [bgColor, '#0a0a1a', '#0a0a0a'], time * 0.1, 0.2);
    drawUtils.vignette(ctx, width, height, 0.6);

    const cardWidth = Math.min(availWidth * 0.85, availHeight * 0.7);
    const cardHeight = cardWidth * 0.75;
    const cornerRadius = cardWidth * 0.05;

    const scanProgress = (time * scanSpeed * 0.3) % 1;
    const spotlightX = Math.cos(scanProgress * Math.PI * 2) * cardWidth * 0.4;
    const spotlightY = Math.sin(scanProgress * Math.PI * 2) * cardHeight * 0.3;

    ctx.save();

    ctx.save();
    ctx.fillStyle = colorUtils.toRgba('#000000', 0.5);
    ctx.filter = 'blur(30px)';
    drawUtils.roundedRect(ctx, -cardWidth / 2 + 10, -cardHeight / 2 + 10, cardWidth, cardHeight, cornerRadius);
    ctx.fill();
    ctx.restore();

    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
    ctx.clip();

    const cardGrad = drawUtils.premiumGradient(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, [colorUtils.adjustBrightness(cardColor, 15), cardColor, colorUtils.adjustBrightness(cardColor, -10)], 135);
    ctx.fillStyle = cardGrad;
    ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);

    const spotlightGlowPulse = easing.dampedOscillation(time * 2, 1.5, 0.2);
    const dynamicSpotlightSize = spotlightSize * (1 + Math.abs(spotlightGlowPulse) * 0.15);

    drawUtils.radialGlow(ctx, spotlightX, spotlightY, dynamicSpotlightSize * 1.5, spotlightColor, 0.4 * springEnter);
    drawUtils.multiLayerGlow(ctx, spotlightX, spotlightY, spotlightColor, dynamicSpotlightSize, 4);

    ctx.restore();

    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      const getBorderPoint = (t: number) => {
        const perimeter = 2 * (cardWidth + cardHeight);
        const dist = t * perimeter;
        if (dist < cardWidth) return { x: -cardWidth / 2 + dist, y: -cardHeight / 2 };
        else if (dist < cardWidth + cardHeight) return { x: cardWidth / 2, y: -cardHeight / 2 + (dist - cardWidth) };
        else if (dist < 2 * cardWidth + cardHeight) return { x: cardWidth / 2 - (dist - cardWidth - cardHeight), y: cardHeight / 2 };
        else return { x: -cardWidth / 2, y: cardHeight / 2 - (dist - 2 * cardWidth - cardHeight) };
      };
      const p1 = getBorderPoint(t1);
      const p2 = getBorderPoint(t2);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = midX - spotlightX;
      const dy = midY - spotlightY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const glow = Math.max(0, (glowIntensity * springEnter) * (1 - distance / (dynamicSpotlightSize * 1.5)));
      if (glow > 5) {
        ctx.save();
        ctx.strokeStyle = colorUtils.toRgba(spotlightColor, glow / 100);
        ctx.lineWidth = 3;
        ctx.shadowColor = spotlightColor;
        ctx.shadowBlur = glow;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.save();
    drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
    ctx.strokeStyle = colorUtils.toRgba(spotlightColor, 0.2);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    const titleFontSize = adaptiveLayout.calculateFontSize(ctx, title, cardWidth * 0.8, cardHeight * 0.3);
    ctx.save();
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawUtils.neonText(ctx, title, 0, -cardHeight * 0.15, spotlightColor, 0.8);
    ctx.restore();

    const descFontSize = titleFontSize * 0.35;
    ctx.save();
    ctx.fillStyle = colorUtils.toRgba(textColor, 0.6);
    ctx.font = `${descFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(description, 0, cardHeight * 0.1);
    ctx.restore();

    drawUtils.particle(ctx, spotlightX, spotlightY, 8, spotlightColor, 0.8, 0.5);
    drawUtils.radialGlow(ctx, spotlightX, spotlightY, 20, '#ffffff', 0.6);

    ctx.save();
    ctx.strokeStyle = colorUtils.toRgba(spotlightColor, 0.5);
    ctx.lineWidth = 2;
    const cornerSize = cardWidth * 0.06;
    const padding = cardWidth * 0.05;
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
    title: 'SPOTLIGHT',
    description: 'Hover to reveal',
    bgColor: '#0a0a0a',
    cardColor: '#111111',
    textColor: '#ffffff',
    spotlightColor: '#00d4ff',
    spotlightSize: 150,
    glowIntensity: 40,
    scanSpeed: 1
  })
};
