import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

export const fallingTextTemplate: TemplateDefinition = {
  id: 'text_falling',
  name: '下落文字',
  description: '文字逐个下落弹跳的动画效果',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'FALLING',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'color',
      label: '文字颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'fallSpeed',
      label: '下落速度',
      type: 'number',
      default: 1,
      min: 0.5,
      max: 3,
      step: 0.1
    },
    {
      key: 'bounceHeight',
      label: '弹跳高度',
      type: 'number',
      default: 0.3,
      min: 0.1,
      max: 0.8,
      step: 0.1
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 25,
      min: 10,
      max: 60,
      step: 5
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const text = paramGuard.string(params.text, 'FALLING');
    const color = paramGuard.color(params.color, '#00d4ff');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const fallSpeed = paramGuard.number(params.fallSpeed, 1, 0.5, 3);
    const bounceHeight = paramGuard.number(params.bounceHeight, 0.3, 0.1, 0.8);
    const glowIntensity = paramGuard.number(params.glowIntensity, 25, 10, 60);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availSize.width, availSize.height
    );

    ctx.save();
    ctx.fillStyle = '#050510';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.ocean.slice(2, 5), time * 0.2, 0.18);
    drawUtils.vignette(ctx, width, height, 0.55);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const charWidths: number[] = [];
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const charWidth = ctx.measureText(text[i]).width;
      charWidths.push(charWidth);
      totalWidth += charWidth;
    }

    const charSpacing = fontSize * 0.1;
    totalWidth += charSpacing * (text.length - 1);

    let currentX = -totalWidth / 2;

    const floatOffset = easing.perlinNoise1D(time * 0.6, 1, 0) * fontSize * 0.02 * (1 - p);

    const exitProgress = p > 0.75 ? (p - 0.75) / 0.25 : 0;
    const exitAlpha = 1 - easing.easeInCubic(exitProgress);

    const pal = palettes.ocean;

    for (let i = 0; i < text.length; i++) {
      const charDelay = i * 0.08 / fallSpeed;
      const charDuration = 0.6 / fallSpeed;
      const charProgress = Math.max(0, Math.min(1, (p - charDelay) / charDuration));

      if (charProgress > 0) {
        const gravityY = easing.gravityBounce(charProgress, 0.5 + bounceHeight, 15);
        const fallY = (1 - gravityY) * fontSize * 2;
        const wobbleY = easing.dampedOscillation(charProgress, 5, 0.2) * fontSize * 0.05;
        const yOffset = fallY + wobbleY + floatOffset;

        const impactSquash = easing.dampedOscillation(charProgress, 8, 0.3);
        const scaleY = 1 + impactSquash * 0.12;
        const scaleX = 1 - impactSquash * 0.06;

        const colorT = i / Math.max(1, text.length - 1);
        const charGradColors = [
          colorUtils.lerpColor(pal[3], pal[4], colorT),
          colorUtils.lerpColor(pal[4], pal[5], colorT),
          colorUtils.lerpColor(pal[5], '#ffffff', colorT * 0.3),
        ];

        ctx.save();
        ctx.translate(currentX + charWidths[i] / 2, yOffset);
        ctx.scale(scaleX, scaleY);

        drawUtils.multiLayerGlow(ctx, 0, fontSize * 0.35, glowColor, fontSize * 0.6, 4);

        ctx.save();
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = eased * exitAlpha;

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity * eased * 0.5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = fontSize * 0.04;

        drawUtils.gradientText(ctx, text[i], 0, fontSize * 0.35, charGradColors, 135 + i * 15);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = eased * exitAlpha * 0.12;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text[i], 0, fontSize * 0.35 - 1);
        ctx.restore();

        ctx.restore();

        const shadowScale = 1 - gravityY * 0.5;
        const shadowAlpha = gravityY * 0.4;
        ctx.save();
        ctx.translate(currentX + charWidths[i] / 2, fontSize * 0.5);
        ctx.scale(shadowScale, shadowScale * 0.3);
        const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, charWidths[i] * 0.6);
        shadowGrad.addColorStop(0, colorUtils.withAlpha(0, 0, 0, shadowAlpha * 0.5));
        shadowGrad.addColorStop(1, colorUtils.withAlpha(0, 0, 0, 0));
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, charWidths[i] * 0.6, fontSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (charProgress > 0.4 && charProgress < 0.7) {
          const impactAlpha = Math.sin((charProgress - 0.4) / 0.3 * Math.PI) * 0.6;
          const particleCount = 5;
          for (let j = 0; j < particleCount; j++) {
            const pAngle = (j / particleCount) * Math.PI + Math.PI * 0.5;
            const pDist = fontSize * 0.3 * (1 - (charProgress - 0.4) / 0.3);
            const px = currentX + charWidths[i] / 2 + Math.cos(pAngle) * pDist;
            const py = fontSize * 0.5 + Math.sin(pAngle) * pDist * 0.5;
            drawUtils.particle(ctx, px, py, 4, glowColor, impactAlpha * eased * exitAlpha, 0.6);
          }
        }
      }

      currentX += charWidths[i] + charSpacing;
    }

    ctx.save();
    const shimmerP = (time * 0.25) % 1;
    ctx.globalAlpha = 0.2 * eased * exitAlpha;
    drawUtils.shimmerLine(ctx, -totalWidth / 2, -fontSize * 0.5, totalWidth, fontSize * 2.5, shimmerP, glowColor, 0.3);
    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'FALLING',
    color: '#00d4ff',
    glowColor: '#00d4ff',
    fallSpeed: 1,
    bounceHeight: 0.3,
    glowIntensity: 25
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
