import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

export const shinyTextTemplate: TemplateDefinition = {
  id: 'text_shiny',
  name: '闪烁文字',
  description: '带有闪烁光效和微动画的文字效果',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'SHINY',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'color',
      label: '文字颜色',
      type: 'color',
      default: '#ffd700'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#ffec8b'
    },
    {
      key: 'blinkSpeed',
      label: '闪烁速度',
      type: 'number',
      default: 3,
      min: 0.5,
      max: 10,
      step: 0.5
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 40,
      min: 10,
      max: 100,
      step: 5
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const text = paramGuard.string(params.text, 'SHINY');
    const color = paramGuard.color(params.color, '#ffd700');
    const glowColor = paramGuard.color(params.glowColor, '#ffec8b');
    const blinkSpeed = paramGuard.number(params.blinkSpeed, 3, 0.5, 10);
    const glowIntensity = paramGuard.number(params.glowIntensity, 40, 10, 100);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availSize.width, availSize.height
    );

    ctx.save();
    ctx.fillStyle = '#0a0812';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.ember.slice(3, 6), time * 0.2, 0.18);
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    const blinkPhase = (time * blinkSpeed) % (Math.PI * 2);
    const blinkValue = (Math.sin(blinkPhase) + 1) / 2;

    const microBounce = easing.perlinNoise1D(time * 1.5, 1, 0) * 0.02 * (1 - p);

    const enterProgress = Math.min(1, p / 0.3);
    const enterScale = easing.spring(enterProgress, 120, 10, 1);

    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitScale = 1 - easing.easeInCubic(exitProgress) * 0.3;

    const finalScale = enterScale * exitScale * (1 + microBounce);

    ctx.save();
    ctx.scale(finalScale, finalScale);

    const currentGlow = glowIntensity * (0.5 + blinkValue * 0.5) * eased;

    drawUtils.multiLayerGlow(ctx, 0, 0, glowColor, fontSize * 1.2, 5);

    const chromeGradColors = [
      colorUtils.lerpColor('#888888', color, 0.3),
      color,
      colorUtils.lerpColor(color, '#ffffff', 0.4),
      color,
      colorUtils.lerpColor('#888888', color, 0.3),
    ];

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = currentGlow * 0.6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = fontSize * 0.06;

    drawUtils.gradientText(ctx, text, 0, 0, chromeGradColors, 180);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = eased * 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, -1);
    ctx.restore();

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    drawUtils.specularHighlight(ctx, -fontSize * text.length * 0.3, -fontSize * 0.5, fontSize * text.length * 0.6, fontSize, fontSize * 0.15, 0.12 * eased);

    const shineSweep = easing.momentumEase(
      (time * blinkSpeed * 0.15) % 1,
      2,
      0.5
    );
    drawUtils.shimmerLine(ctx, -fontSize * text.length * 0.4, -fontSize * 0.5, fontSize * text.length * 0.8, fontSize, shineSweep, '#ffffff', 0.5 * blinkValue * eased);

    ctx.restore();

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = colorUtils.lerpColor(color, '#ffffff', 0.3);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2 * eased;
    ctx.strokeText(text, 0, 0);
    ctx.restore();

    ctx.save();
    const sparkCount = 8;
    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = (i / sparkCount) * Math.PI * 2 + time * 0.5;
      const sparkDist = fontSize * 0.8 + easing.perlinNoise1D(time * 2 + i * 3.7, 1, i * 5) * fontSize * 0.3;
      const sparkX = Math.cos(sparkAngle) * sparkDist;
      const sparkY = Math.sin(sparkAngle) * sparkDist;
      const sparkAlpha = (0.3 + blinkValue * 0.4) * eased * easing.perlinNoise1D(time * 3 + i * 1.3, 1, i * 7);
      drawUtils.particle(ctx, sparkX, sparkY, 4 + blinkValue * 3, color, sparkAlpha, 0.6);
    }
    ctx.restore();

    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'SHINY',
    color: '#ffd700',
    glowColor: '#ffec8b',
    blinkSpeed: 3,
    glowIntensity: 40
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
