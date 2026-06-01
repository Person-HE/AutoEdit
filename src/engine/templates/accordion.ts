import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const accordionTemplate: TemplateDefinition = {
  id: 'ui_accordion',
  name: '手风琴',
  description: '玻璃拟态风格的手风琴展开/收起组件',
  category: 'ui',
  schema: [
    { key: 'items', label: '项目列表', type: 'textarea', default: '设计系统,组件库,动效引擎,渲染管线', placeholder: '用逗号分隔项目' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0f0f23' },
    { key: 'cardColor', label: '卡片颜色', type: 'color', default: '#1a1a3e' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'cornerRadius', label: '圆角大小', type: 'number', default: 16, min: 0, max: 40, step: 2 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const itemsStr = paramGuard.string(params.items, '设计系统,组件库,动效引擎,渲染管线');
    const bgColor = paramGuard.color(params.bgColor, '#0f0f23');
    const cardColor = paramGuard.color(params.cardColor, '#1a1a3e');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const cornerRadius = paramGuard.number(params.cornerRadius, 16, 0, 40);
    const p = paramGuard.number(progress, 0, 0, 1);
    const items = itemsStr.split(',').map(s => s.trim()).filter(Boolean);
    const itemCount = Math.max(1, Math.min(items.length, 8));

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.dream, time * 0.15, 0.3);
    drawUtils.vignette(ctx, width, height, 0.45);

    const containerWidth = Math.min(availSize.width * 0.85, 500);
    const itemHeight = Math.min(availSize.height * 0.12, 60);
    const itemSpacing = 8;
    const expandedExtraHeight = itemHeight * 1.2;
    const activeIndex = Math.floor((time * 0.5) % itemCount);
    const expandProgress = ((time * 0.5) % 1);

    const totalHeight = itemCount * (itemHeight + itemSpacing) + expandedExtraHeight;
    let currentY = -totalHeight / 2;

    for (let i = 0; i < itemCount; i++) {
      const itemEnterDelay = i * 0.08;
      const itemEnterProgress = Math.max(0, Math.min(1, (p - itemEnterDelay) / 0.3));
      const itemEnterSpring = easing.spring(itemEnterProgress, 100, 14, 1);
      const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
      const exitEased = easing.easeInCubic(exitProgress);

      const isActive = i === activeIndex;
      const expandEase = isActive ? easing.easeOutCubic(Math.min(1, expandProgress * 2)) : 0;
      const collapseEase = isActive ? 0 : easing.easeOutCubic(Math.min(1, expandProgress * 2));
      const currentExpand = isActive ? expandEase : (i === (activeIndex + itemCount - 1) % itemCount ? 1 - expandEase : 0);
      const currentItemHeight = itemHeight + expandedExtraHeight * currentExpand;

      ctx.save();
      const slideX = (1 - itemEnterSpring) * 100;
      ctx.translate(slideX * (1 - exitEased), 0);
      ctx.globalAlpha = itemEnterSpring * (1 - exitEased);

      ctx.save();
      ctx.fillStyle = colorUtils.toRgba('#000000', 0.3);
      ctx.filter = 'blur(15px)';
      drawUtils.roundedRect(ctx, -containerWidth / 2 + 4, currentY + 4, containerWidth, currentItemHeight, cornerRadius);
      ctx.fill();
      ctx.restore();

      if (isActive) {
        drawUtils.multiLayerGlow(ctx, 0, currentY + currentItemHeight / 2, accentColor, containerWidth * 0.2, 4);
      }

      const itemGrad = drawUtils.premiumGradient(ctx, -containerWidth / 2, currentY, containerWidth, currentItemHeight, [colorUtils.adjustBrightness(cardColor, isActive ? 30 : 15), cardColor, colorUtils.adjustBrightness(cardColor, -20), colorUtils.lerpColor(cardColor, accentColor, isActive ? 0.15 : 0.05)], 135);
      drawUtils.roundedRect(ctx, -containerWidth / 2, currentY, containerWidth, currentItemHeight, cornerRadius);
      ctx.fillStyle = itemGrad;
      ctx.fill();

      drawUtils.glassBackground(ctx, -containerWidth / 2, currentY, containerWidth, currentItemHeight, cornerRadius, isActive ? 0.1 : 0.06, colorUtils.toRgba(accentColor, isActive ? 0.15 : 0.05));
      drawUtils.specularHighlight(ctx, -containerWidth / 2 + 3, currentY + 3, containerWidth - 6, currentItemHeight, cornerRadius * 0.8, 0.15);

      if (isActive) {
        const shimmerProgress = (time * 0.25) % 1;
        ctx.save();
        drawUtils.roundedRect(ctx, -containerWidth / 2, currentY, containerWidth, currentItemHeight, cornerRadius);
        ctx.clip();
        drawUtils.shimmerLine(ctx, -containerWidth / 2, currentY, containerWidth, currentItemHeight, shimmerProgress, accentColor, 0.1);
        ctx.restore();
      }

      ctx.save();
      drawUtils.roundedRect(ctx, -containerWidth / 2, currentY, containerWidth, currentItemHeight, cornerRadius);
      ctx.strokeStyle = colorUtils.toRgba(accentColor, isActive ? 0.4 : 0.15);
      ctx.lineWidth = isActive ? 1.5 : 0.5;
      ctx.stroke();
      ctx.restore();

      const padding = 20;
      const fontSize = adaptiveLayout.calculateFontSize(ctx, items[i] || '', containerWidth * 0.7, itemHeight * 0.6);
      ctx.save();
      ctx.font = `${isActive ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (isActive) {
        drawUtils.gradientText(ctx, items[i] || '', -containerWidth / 2 + padding, currentY + itemHeight / 2, [accentColor, '#ffffff'], 90);
      } else {
        ctx.fillStyle = colorUtils.toRgba(textColor, 0.7);
        ctx.fillText(items[i] || '', -containerWidth / 2 + padding, currentY + itemHeight / 2);
      }
      ctx.restore();

      const chevronX = containerWidth / 2 - padding - 10;
      const chevronY = currentY + itemHeight / 2;
      const chevronSize = fontSize * 0.4;
      const chevronRotation = isActive ? currentExpand * Math.PI : 0;
      ctx.save();
      ctx.translate(chevronX, chevronY);
      ctx.rotate(chevronRotation);
      ctx.strokeStyle = colorUtils.toRgba(accentColor, isActive ? 0.8 : 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-chevronSize, -chevronSize / 2);
      ctx.lineTo(0, chevronSize / 2);
      ctx.lineTo(chevronSize, -chevronSize / 2);
      ctx.stroke();
      ctx.restore();

      if (isActive && currentExpand > 0.3) {
        const contentAlpha = Math.min(1, (currentExpand - 0.3) / 0.7);
        const contentFontSize = fontSize * 0.5;
        ctx.save();
        ctx.globalAlpha = contentAlpha;
        ctx.fillStyle = colorUtils.toRgba(textColor, 0.5);
        ctx.font = `${contentFontSize}px Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('探索更多 →', -containerWidth / 2 + padding, currentY + itemHeight + 10);
        ctx.restore();
      }

      drawUtils.particle(ctx, -containerWidth / 2 + padding / 2, currentY + itemHeight / 2, 4, accentColor, isActive ? 0.6 : 0.2, 0.5);

      ctx.restore();
      currentY += currentItemHeight + itemSpacing;
    }
  },

  initParams: () => ({
    items: '设计系统,组件库,动效引擎,渲染管线',
    bgColor: '#0f0f23',
    cardColor: '#1a1a3e',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    cornerRadius: 16
  })
};
