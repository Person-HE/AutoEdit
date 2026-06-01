import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const cardStackTemplate: TemplateDefinition = {
  id: 'ui_card_stack',
  name: '卡片堆叠',
  description: '多层卡片堆叠效果，带有层次感和展开动画',
  category: 'ui',
  schema: [
    { key: 'cardCount', label: '卡片数量', type: 'number', default: 4, min: 2, max: 6, step: 1 },
    { key: 'title', label: '主标题', type: 'string', default: 'FEATURES', placeholder: '输入主标题' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#1a1a2e' },
    { key: 'cardColors', label: '卡片颜色', type: 'string', default: '#00d4ff,#ff6b6b,#4ecdc4,#ffe66d', placeholder: '用逗号分隔颜色值' },
    { key: 'spreadAmount', label: '展开幅度', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const cardCount = paramGuard.number(params.cardCount, 4, 2, 6);
    const title = paramGuard.string(params.title, 'FEATURES');
    const bgColor = paramGuard.color(params.bgColor, '#1a1a2e');
    const cardColorsStr = paramGuard.string(params.cardColors, '#00d4ff,#ff6b6b,#4ecdc4,#ffe66d');
    const spreadAmount = paramGuard.number(params.spreadAmount, 1, 0.5, 2);
    const cardColors = cardColorsStr.split(',').map(c => c.trim()).filter(Boolean);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.4);
    const enterEased = easing.spring(enterProgress, 120, 14, 1);
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitEased = easing.easeInCubic(exitProgress);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.premium, time * 0.15, 0.3);
    drawUtils.vignette(ctx, width, height, 0.5);

    const cardWidth = Math.min(availSize.width * 0.5, 280);
    const cardHeight = Math.min(availSize.height * 0.55, 350);
    const cornerRadius = 20;

    const titleFontSize = adaptiveLayout.calculateFontSize(ctx, title, availSize.width * 0.9, availSize.height * 0.15);
    const titleSpring = easing.spring(Math.min(1, enterProgress * 1.2), 80, 10, 1);
    ctx.save();
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = titleSpring * (1 - exitEased);
    drawUtils.gradientText(ctx, title, 0, -availSize.height / 2 + 20, palettes.cyberpunk.slice(0, 4), 90);
    ctx.restore();

    const centerIndex = (cardCount - 1) / 2;
    const maxSpread = cardWidth * 0.35 * spreadAmount;

    for (let i = 0; i < cardCount; i++) {
      const cardColor = cardColors[i % cardColors.length] || '#00d4ff';
      const offsetFromCenter = i - centerIndex;
      const cardEnterProgress = Math.max(0, Math.min(1, (p - i * 0.08) / 0.35));
      const cardBounce = easing.gravityBounce(cardEnterProgress, 0.5, 12);
      const cardSettle = easing.spring(cardEnterProgress, 150, 16, 1);
      const targetX = offsetFromCenter * maxSpread * cardSettle * (1 - exitEased);
      const targetY = Math.abs(offsetFromCenter) * 15 * cardSettle * (1 - exitEased);
      const targetRotate = offsetFromCenter * 8 * cardSettle * (1 - exitEased);
      const stackDrop = (1 - cardBounce) * (cardCount - i) * 30;
      const stackOffset = (1 - cardSettle) * (cardCount - i) * 5;

      ctx.save();
      ctx.translate(targetX, targetY + stackOffset + stackDrop);
      ctx.rotate(targetRotate * Math.PI / 180);
      ctx.scale(cardSettle * (1 - exitEased * 0.3), cardSettle * (1 - exitEased * 0.3));

      const shadowOffset = 8 + (1 - cardBounce) * 10;
      ctx.save();
      ctx.fillStyle = colorUtils.toRgba('#000000', 0.4);
      ctx.filter = `blur(${shadowOffset}px)`;
      drawUtils.roundedRect(ctx, -cardWidth / 2 + shadowOffset, -cardHeight / 2 + shadowOffset, cardWidth, cardHeight, cornerRadius);
      ctx.fill();
      ctx.restore();

      drawUtils.multiLayerGlow(ctx, 0, 0, cardColor, cardWidth * 0.3, 4);

      const cardGrad = drawUtils.premiumGradient(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, [colorUtils.adjustBrightness(cardColor, 50), cardColor, colorUtils.adjustBrightness(cardColor, -30)], 180);
      drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
      ctx.fillStyle = cardGrad;
      ctx.fill();

      drawUtils.glassBackground(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius, 0.1, colorUtils.toRgba(cardColor, 0.15));
      drawUtils.specularHighlight(ctx, -cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight, cornerRadius * 0.8, 0.2);

      const shimmerProgress = (time * 0.2 + i * 0.15) % 1;
      ctx.save();
      drawUtils.roundedRect(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, cornerRadius);
      ctx.clip();
      drawUtils.shimmerLine(ctx, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, shimmerProgress, cardColor, 0.1);
      ctx.restore();

      const cardNum = String(i + 1).padStart(2, '0');
      ctx.save();
      ctx.font = `bold ${cardHeight * 0.35}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawUtils.gradientText(ctx, cardNum, 0, 0, ['#ffffff', colorUtils.lerpColor(cardColor, '#ffffff', 0.5)], 180);
      ctx.restore();

      const microFloat = easing.dampedOscillation(time * 3 + i, 0.6, 0.05) * 4 * cardSettle * (1 - exitEased);
      ctx.translate(0, microFloat);
      ctx.restore();
    }
  },

  initParams: (duration: number) => ({
    cardCount: 4,
    title: 'FEATURES',
    bgColor: '#1a1a2e',
    cardColors: '#00d4ff,#ff6b6b,#4ecdc4,#ffe66d',
    spreadAmount: 1
  })
};
