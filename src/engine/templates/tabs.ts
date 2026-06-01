import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const tabsTemplate: TemplateDefinition = {
  id: 'ui_tabs',
  name: '标签页',
  description: '带有渐变指示器和发光效果的高级标签页组件',
  category: 'ui',
  schema: [
    { key: 'tabs', label: '标签列表', type: 'textarea', default: '概览,特性,定价,关于', placeholder: '用逗号分隔标签' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0f0f23' },
    { key: 'tabColor', label: '标签颜色', type: 'color', default: '#1a1a3e' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'cornerRadius', label: '圆角大小', type: 'number', default: 12, min: 0, max: 30, step: 2 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const tabsStr = paramGuard.string(params.tabs, '概览,特性,定价,关于');
    const bgColor = paramGuard.color(params.bgColor, '#0f0f23');
    const tabColor = paramGuard.color(params.tabColor, '#1a1a3e');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const cornerRadius = paramGuard.number(params.cornerRadius, 12, 0, 30);
    const p = paramGuard.number(progress, 0, 0, 1);
    const tabs = tabsStr.split(',').map(s => s.trim()).filter(Boolean);
    const tabCount = Math.max(2, Math.min(tabs.length, 6));

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.frost, time * 0.12, 0.25);
    drawUtils.vignette(ctx, width, height, 0.4);

    const containerWidth = Math.min(availSize.width * 0.9, 600);
    const tabHeight = Math.min(availSize.height * 0.12, 50);
    const tabWidth = containerWidth / tabCount;
    const contentHeight = Math.min(availSize.height * 0.5, 200);

    const enterProgress = Math.min(1, p / 0.4);
    const enterSpring = easing.spring(enterProgress, 100, 14, 1);

    const activeTab = Math.floor((time * 0.4) % tabCount);
    const tabTransition = (time * 0.4) % 1;
    const indicatorX = -containerWidth / 2 + activeTab * tabWidth;
    const nextIndicatorX = -containerWidth / 2 + ((activeTab + 1) % tabCount) * tabWidth;
    const indicatorEase = easing.easeInOutCubic(tabTransition);
    const currentIndicatorX = indicatorX + (nextIndicatorX - indicatorX) * indicatorEase;

    ctx.save();
    ctx.scale(enterSpring, enterSpring);

    ctx.save();
    ctx.fillStyle = colorUtils.toRgba('#000000', 0.3);
    ctx.filter = 'blur(20px)';
    drawUtils.roundedRect(ctx, -containerWidth / 2 + 4, -contentHeight / 2 - tabHeight + 4, containerWidth, tabHeight + contentHeight + 10, cornerRadius);
    ctx.fill();
    ctx.restore();

    const containerGrad = drawUtils.premiumGradient(ctx, -containerWidth / 2, -contentHeight / 2 - tabHeight, containerWidth, tabHeight + contentHeight + 10, [colorUtils.adjustBrightness(tabColor, 15), tabColor, colorUtils.adjustBrightness(tabColor, -15)], 180);
    drawUtils.roundedRect(ctx, -containerWidth / 2, -contentHeight / 2 - tabHeight, containerWidth, tabHeight + contentHeight + 10, cornerRadius);
    ctx.fillStyle = containerGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -containerWidth / 2, -contentHeight / 2 - tabHeight, containerWidth, tabHeight + contentHeight + 10, cornerRadius, 0.06, colorUtils.toRgba(accentColor, 0.08));
    drawUtils.specularHighlight(ctx, -containerWidth / 2 + 3, -contentHeight / 2 - tabHeight + 3, containerWidth - 6, tabHeight + contentHeight + 10, cornerRadius * 0.8, 0.15);

    const tabY = -contentHeight / 2 - tabHeight;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-containerWidth / 2, tabY, containerWidth, tabHeight);
    ctx.clip();

    for (let i = 0; i < tabCount; i++) {
      const tabX = -containerWidth / 2 + i * tabWidth;
      const isActive = i === activeTab;
      const fontSize = adaptiveLayout.calculateFontSize(ctx, tabs[i] || '', tabWidth * 0.8, tabHeight * 0.5);

      ctx.save();
      ctx.font = `${isActive ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isActive) {
        drawUtils.gradientText(ctx, tabs[i] || '', tabX + tabWidth / 2, tabY + tabHeight / 2, [accentColor, '#ffffff'], 90);
      } else {
        ctx.fillStyle = colorUtils.toRgba(textColor, 0.5);
        ctx.fillText(tabs[i] || '', tabX + tabWidth / 2, tabY + tabHeight / 2);
      }
      ctx.restore();

      if (i < tabCount - 1) {
        ctx.beginPath();
        ctx.moveTo(tabX + tabWidth, tabY + tabHeight * 0.2);
        ctx.lineTo(tabX + tabWidth, tabY + tabHeight * 0.8);
        ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.1);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();

    const indicatorWidth = tabWidth * 0.6;
    const indicatorHeight = 3;
    const indicatorY = tabY + tabHeight - indicatorHeight - 4;

    drawUtils.multiLayerGlow(ctx, currentIndicatorX + tabWidth / 2, indicatorY, accentColor, indicatorWidth * 0.4, 4);

    const indicatorGrad = drawUtils.premiumGradient(ctx, currentIndicatorX + (tabWidth - indicatorWidth) / 2, indicatorY, indicatorWidth, indicatorHeight, [accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), accentColor], 90);
    ctx.save();
    ctx.fillStyle = indicatorGrad;
    drawUtils.roundedRect(ctx, currentIndicatorX + (tabWidth - indicatorWidth) / 2, indicatorY, indicatorWidth, indicatorHeight, indicatorHeight / 2);
    ctx.fill();
    ctx.restore();

    const contentY = -contentHeight / 2 + 10;
    const contentPad = 20;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-containerWidth / 2 + contentPad, contentY, containerWidth - contentPad * 2, contentHeight - 10);
    ctx.clip();

    const contentFontSize = adaptiveLayout.calculateFontSize(ctx, tabs[activeTab] || '', containerWidth * 0.6, contentHeight * 0.4);
    ctx.font = `bold ${contentFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawUtils.gradientText(ctx, tabs[activeTab] || '', 0, contentY + contentHeight / 2 - 10, [accentColor, '#ffffff'], 90);

    const subFontSize = contentFontSize * 0.35;
    ctx.fillStyle = colorUtils.toRgba(textColor, 0.4);
    ctx.font = `${subFontSize}px Arial, sans-serif`;
    ctx.fillText(`Tab ${activeTab + 1} content area`, 0, contentY + contentHeight / 2 + contentFontSize * 0.6);
    ctx.restore();

    ctx.save();
    drawUtils.roundedRect(ctx, -containerWidth / 2, -contentHeight / 2 - tabHeight, containerWidth, tabHeight + contentHeight + 10, cornerRadius);
    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.2);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  },

  initParams: () => ({
    tabs: '概览,特性,定价,关于',
    bgColor: '#0f0f23',
    tabColor: '#1a1a3e',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    cornerRadius: 12
  })
};
