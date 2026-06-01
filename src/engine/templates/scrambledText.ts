import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, palettes, animationUtils } from './templateUtils';

const SCRAMBLE_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const scrambledTextTemplate: TemplateDefinition = {
  id: 'text_scrambled',
  name: '乱序解码文字',
  description: '文字从乱码状态逐渐解码为正确内容的动画效果，带有发光增强',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '显示文字',
      type: 'string',
      default: 'DECODED',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'textColor',
      label: '文字颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'bgColor',
      label: '背景颜色',
      type: 'color',
      default: '#0a0a0a'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 35,
      min: 0,
      max: 100,
      step: 5
    },
    {
      key: 'scrambleSpeed',
      label: '解码速度',
      type: 'number',
      default: 1,
      min: 0.5,
      max: 3,
      step: 0.5
    },
    {
      key: 'charRevealDelay',
      label: '字符揭示延迟',
      type: 'number',
      default: 0.1,
      min: 0,
      max: 0.5,
      step: 0.05
    },
    {
      key: 'enableGlitch',
      label: '启用故障效果',
      type: 'boolean',
      default: true
    },
    {
      key: 'glitchIntensity',
      label: '故障强度',
      type: 'number',
      default: 5,
      min: 0,
      max: 20,
      step: 1
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const { width: availWidth, height: availHeight } =
      adaptiveLayout.getAvailableSize(width, height, 0.95);

    const text = paramGuard.string(params.text, 'DECODED');
    const textColor = paramGuard.color(params.textColor, '#00d4ff');
    const bgColor = paramGuard.color(params.bgColor, '#0a0a0a');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const glowIntensity = paramGuard.number(params.glowIntensity, 35, 0, 100);
    const scrambleSpeed = paramGuard.number(params.scrambleSpeed, 1, 0.5, 3);
    const charRevealDelay = paramGuard.number(params.charRevealDelay, 0.1, 0, 0.5);
    const enableGlitch = paramGuard.boolean(params.enableGlitch, true);
    const glitchIntensity = paramGuard.number(params.glitchIntensity, 5, 0, 20);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(Math.min(1, p * scrambleSpeed));

    ctx.save();
    ctx.fillStyle = '#040410';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.matrix.slice(2, 5), time * 0.3, 0.15);
    drawUtils.vignette(ctx, width, height, 0.55);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.03, time);
    ctx.restore();

    const fontSize = adaptiveLayout.calculateFontSize(ctx, text, availWidth, availHeight * 0.6);
    const charWidth = fontSize * 0.6;

    const breathe = easing.perlinNoise1D(time * 0.8, 1, 0) * 0.01;

    const chars = text.split('');
    const totalChars = chars.length;

    const pal = palettes.matrix;

    drawUtils.multiLayerGlow(ctx, 0, 0, glowColor, fontSize * 1.2, 5);

    ctx.save();
    ctx.font = `bold ${fontSize}px 'Courier New', monospace, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const totalWidth = totalChars * charWidth;
    const startX = -totalWidth / 2 + charWidth / 2;

    chars.forEach((char, index) => {
      const charProgress = Math.max(0, Math.min(1,
        (eased - index * charRevealDelay) / (1 - (totalChars - 1) * charRevealDelay)
      ));
      const charEased = easing.snapSpring(charProgress, 280, 26);

      const x = startX + index * charWidth;
      const y = 0;

      let glitchOffsetX = 0;
      let glitchOffsetY = 0;
      if (enableGlitch && charProgress < 1 && charProgress > 0) {
        const glitchPhase = 1 - charProgress;
        glitchOffsetX = easing.perlinNoise1D(time * 15 + index * 3.7, 2, index * 5) * glitchIntensity * glitchPhase;
        glitchOffsetY = easing.perlinNoise1D(time * 15 + index * 5.3, 2, index * 7) * glitchIntensity * glitchPhase;
      }

      let displayChar: string;
      let charAlpha: number;

      if (charProgress >= 1) {
        displayChar = char;
        charAlpha = 1;
      } else if (charProgress <= 0) {
        const noiseSeed = easing.perlinNoise1D(time * 8 + index * 0.5, 2, index * 11);
        displayChar = SCRAMBLE_CHARS[Math.floor(noiseSeed * SCRAMBLE_CHARS.length)];
        charAlpha = 0.5;
      } else {
        const noiseSeed = easing.perlinNoise1D(time * 12 + index * 0.7, 2, index * 13);
        const isCorrect = noiseSeed < charEased;
        displayChar = isCorrect ? char : SCRAMBLE_CHARS[Math.floor(easing.perlinNoise1D(time * 10 + index * 0.3, 2, index * 17) * SCRAMBLE_CHARS.length)];
        charAlpha = 0.5 + charEased * 0.5;
      }

      if (char === ' ') {
        displayChar = ' ';
        charAlpha = charProgress > 0.5 ? 0.3 : 0;
      }

      if (charProgress > 0.1) {
        ctx.save();
        const glowRgb = colorUtils.hexToRgb(glowColor);
        ctx.fillStyle = colorUtils.withAlpha(glowRgb.r, glowRgb.g, glowRgb.b, 0.2 * charAlpha);
        ctx.fillText(displayChar, x + 3, y + 3);
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = charAlpha * eased;

      const wobble = easing.dampedOscillation(charProgress, 4, 0.2) * fontSize * 0.02;
      ctx.translate(x + glitchOffsetX, y + glitchOffsetY + wobble);
      ctx.scale(1 + breathe, 1 + breathe);

      const colorT = index / Math.max(1, totalChars - 1);
      const charGradColors = [
        colorUtils.lerpColor(pal[3], pal[4], colorT),
        colorUtils.lerpColor(pal[4], pal[5], colorT),
        colorUtils.lerpColor(pal[5], '#ffffff', colorT * 0.3),
      ];

      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowIntensity * charAlpha * 0.3;
      drawUtils.gradientText(ctx, displayChar, 0, 0, charGradColors, 135 + index * 10);

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      if (charProgress < 1 && char !== ' ') {
        const barGrad = drawUtils.premiumGradient(ctx, -charWidth / 4, fontSize / 2, charWidth / 2, 2, [glowColor, colorUtils.lerpColor(glowColor, '#ffffff', 0.3)], 90);
        ctx.fillStyle = barGrad;
        ctx.globalAlpha = (1 - charProgress) * 0.5 * eased;
        ctx.fillRect(-charWidth / 4, fontSize / 2, charWidth / 2, 2);
      }

      ctx.restore();
    });

    ctx.restore();

    ctx.save();
    const indicatorWidth = Math.min(availWidth * 0.5, 200);
    const indicatorHeight = 4;
    const indicatorY = availHeight * 0.35;

    drawUtils.glassBackground(ctx, -indicatorWidth / 2, indicatorY, indicatorWidth, indicatorHeight, indicatorHeight / 2, 0.06, colorUtils.toRgba(glowColor, 0.1));

    const progressEased = easing.snapSpring(eased, 280, 26);
    const progressWidth = indicatorWidth * progressEased;
    if (progressWidth > 0) {
      const progGrad = drawUtils.premiumGradient(ctx, -indicatorWidth / 2, indicatorY, progressWidth, indicatorHeight, [pal[3], pal[4], pal[5]], 90);
      ctx.fillStyle = progGrad;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      drawUtils.roundedRect(ctx, -indicatorWidth / 2, indicatorY, progressWidth, indicatorHeight, indicatorHeight / 2);
      ctx.fill();
    }

    if (progressEased > 0.01) {
      drawUtils.particle(ctx, -indicatorWidth / 2 + progressWidth, indicatorY + indicatorHeight / 2, indicatorHeight * 2, glowColor, 0.8, 0.5);
    }
    ctx.restore();

    ctx.save();
    ctx.font = `${fontSize * 0.3}px 'Courier New', monospace`;
    const binRgb = colorUtils.hexToRgb(glowColor);
    ctx.fillStyle = colorUtils.withAlpha(binRgb.r, binRgb.g, binRgb.b, 0.08 * (1 - eased));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 10; j++) {
        const bit = Math.floor(easing.perlinNoise1D(i * 10 + j + time * 2, 1, i * 3 + j) * 2);
        const x = -availWidth / 2 + j * (availWidth / 10);
        const y = -availHeight / 2 + i * (fontSize * 0.4);
        ctx.fillText(bit.toString(), x, y);
      }
    }
    ctx.restore();

    ctx.save();
    const cornerSize = 20;
    ctx.strokeStyle = colorUtils.toRgba(glowColor, 0.3 * eased);
    ctx.lineWidth = 1.5;

    drawUtils.lightBeam(ctx, -availWidth / 2 + 10, -availHeight / 2 + cornerSize, -availWidth / 2 + 10, -availHeight / 2 + 10, glowColor, 1, 0.3 * eased, 6);
    drawUtils.lightBeam(ctx, -availWidth / 2 + 10, -availHeight / 2 + 10, -availWidth / 2 + cornerSize, -availHeight / 2 + 10, glowColor, 1, 0.3 * eased, 6);

    drawUtils.lightBeam(ctx, availWidth / 2 - 10, availHeight / 2 - cornerSize, availWidth / 2 - 10, availHeight / 2 - 10, glowColor, 1, 0.3 * eased, 6);
    drawUtils.lightBeam(ctx, availWidth / 2 - 10, availHeight / 2 - 10, availWidth / 2 - cornerSize, availHeight / 2 - 10, glowColor, 1, 0.3 * eased, 6);
    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'DECODED',
    textColor: '#00d4ff',
    bgColor: '#0a0a0a',
    glowColor: '#00d4ff',
    glowIntensity: 35,
    scrambleSpeed: 1,
    charRevealDelay: 0.1,
    enableGlitch: true,
    glitchIntensity: 5
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
