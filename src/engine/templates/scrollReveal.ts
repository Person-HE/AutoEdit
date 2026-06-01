import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const scrollRevealTemplate: TemplateDefinition = {
  id: 'ui_scroll_reveal',
  name: '滚动揭示',
  description: '带有渐变和发光效果的滚动揭示动画',
  category: 'ui',
  schema: [
    { key: 'title', label: '标题', type: 'string', default: 'REVEAL', placeholder: '输入标题' },
    { key: 'subtitle', label: '副标题', type: 'string', default: 'Scroll to discover', placeholder: '输入副标题' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'revealDirection', label: '揭示方向', type: 'select', default: 'up', options: [{ label: '从下到上', value: 'up' }, { label: '从左到右', value: 'left' }, { label: '从右到左', value: 'right' }] }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const title = paramGuard.string(params.title, 'REVEAL');
    const subtitle = paramGuard.string(params.subtitle, 'Scroll to discover');
    const bgColor = paramGuard.color(params.bgColor, '#0a0a1a');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const revealDirection = params.revealDirection || 'up';
    const p = paramGuard.number(progress, 0, 0, 1);

    const revealProgress = easing.easeOutCubic(Math.min(1, p / 0.6));
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitEased = easing.easeInCubic(exitProgress);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.galaxy, time * 0.15, 0.3);
    drawUtils.vignette(ctx, width, height, 0.5);

    const titleFontSize = adaptiveLayout.calculateFontSize(ctx, title, availSize.width * 0.8, availSize.height * 0.3);
    const subtitleFontSize = titleFontSize * 0.35;

    let offsetX = 0, offsetY = 0;
    if (revealDirection === 'up') offsetY = (1 - revealProgress) * 80;
    else if (revealDirection === 'left') offsetX = (1 - revealProgress) * 80;
    else offsetX = -(1 - revealProgress) * 80;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.globalAlpha = revealProgress * (1 - exitEased);

    drawUtils.multiLayerGlow(ctx, 0, -availSize.height * 0.05, accentColor, availSize.width * 0.3, 5);

    ctx.save();
    ctx.font = `bold ${titleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawUtils.gradientText(ctx, title, 0, -availSize.height * 0.1, [accentColor, '#ffffff', accentColor], 90);
    ctx.restore();

    const clipWidth = availSize.width * 0.9 * revealProgress;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-clipWidth / 2, -availSize.height * 0.1 + titleFontSize * 0.5 + 5, clipWidth, 4);
    ctx.clip();
    const lineGrad = drawUtils.premiumGradient(ctx, -availSize.width * 0.45, 0, availSize.width * 0.9, 4, [colorUtils.toRgba(accentColor, 0), accentColor, colorUtils.toRgba(accentColor, 0)], 90);
    ctx.fillStyle = lineGrad;
    ctx.fillRect(-availSize.width * 0.45, -availSize.height * 0.1 + titleFontSize * 0.5 + 5, availSize.width * 0.9, 4);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = colorUtils.toRgba(textColor, 0.6);
    ctx.font = `${subtitleFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(subtitle, 0, availSize.height * 0.05);
    ctx.restore();

    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time * 0.3;
      const radius = availSize.width * 0.25 + Math.sin(time + i) * 20;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius * 0.4;
      const particleAlpha = revealProgress * 0.5 * (0.5 + Math.sin(time * 2 + i) * 0.5);
      drawUtils.particle(ctx, px, py, 6, accentColor, particleAlpha, 0.5);
    }

    ctx.restore();
  },

  initParams: () => ({
    title: 'REVEAL',
    subtitle: 'Scroll to discover',
    bgColor: '#0a0a1a',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    revealDirection: 'up'
  })
};
