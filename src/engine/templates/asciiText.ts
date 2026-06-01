import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, palettes, animationUtils } from './templateUtils';

const ASCII_CHARS = ' .:-=+*#%@';
const EXTENDED_ASCII = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

const generateAsciiArt = (text: string, width: number, height: number, density: number): string[] => {
  const lines: string[] = [];
  const charWidth = Math.floor(width / (density * 0.6));
  const charHeight = Math.floor(height / density);

  for (let y = 0; y < charHeight; y++) {
    let line = '';
    for (let x = 0; x < charWidth; x++) {
      const pattern = Math.sin(x * 0.3) * Math.cos(y * 0.3);
      const charIndex = Math.floor((pattern + 1) / 2 * (ASCII_CHARS.length - 1));
      line += ASCII_CHARS[charIndex];
    }
    lines.push(line);
  }

  return lines;
};

export const asciiTextTemplate: TemplateDefinition = {
  id: 'text_ascii_art',
  name: 'ASCII艺术文字',
  description: '使用ASCII字符构建的艺术文字效果，带有矩阵风格的动画',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '显示文字',
      type: 'string',
      default: 'MATRIX',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'textColor',
      label: '文字颜色',
      type: 'color',
      default: '#00ff41'
    },
    {
      key: 'bgColor',
      label: '背景颜色',
      type: 'color',
      default: '#000000'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#00ff41'
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 25,
      min: 0,
      max: 100,
      step: 5
    },
    {
      key: 'charSet',
      label: '字符集',
      type: 'select',
      default: 'simple',
      options: [
        { label: '简单', value: 'simple' },
        { label: '复杂', value: 'complex' }
      ]
    },
    {
      key: 'matrixEffect',
      label: '矩阵效果',
      type: 'boolean',
      default: true
    },
    {
      key: 'scanLine',
      label: '扫描线效果',
      type: 'boolean',
      default: true
    },
    {
      key: 'revealSpeed',
      label: '揭示速度',
      type: 'number',
      default: 1,
      min: 0.5,
      max: 3,
      step: 0.5
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const { width: availWidth, height: availHeight } =
      adaptiveLayout.getAvailableSize(width, height, 0.95);

    const text = paramGuard.string(params.text, 'MATRIX');
    const textColor = paramGuard.color(params.textColor, '#00ff41');
    const bgColor = paramGuard.color(params.bgColor, '#000000');
    const glowColor = paramGuard.color(params.glowColor, '#00ff41');
    const glowIntensity = paramGuard.number(params.glowIntensity, 25, 0, 100);
    const charSet = paramGuard.string(params.charSet, 'simple');
    const matrixEffect = paramGuard.boolean(params.matrixEffect, true);
    const scanLine = paramGuard.boolean(params.scanLine, true);
    const revealSpeed = paramGuard.number(params.revealSpeed, 1, 0.5, 3);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.spring(Math.min(1, p * revealSpeed), 150, 14, 1);

    ctx.save();
    ctx.fillStyle = '#020208';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.matrix.slice(2, 5), time * 0.2, 0.12);
    drawUtils.vignette(ctx, width, height, 0.6);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.03, time);
    ctx.restore();

    const fontSize = Math.min(availWidth / 15, availHeight / 8);
    const charWidth = fontSize * 0.6;
    const charHeight = fontSize;

    const cols = Math.floor(availWidth / charWidth);
    const rows = Math.floor(availHeight / charHeight);

    const chars = charSet === 'complex' ? EXTENDED_ASCII : ASCII_CHARS;

    if (matrixEffect) {
      ctx.save();
      ctx.font = `${fontSize * 0.5}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < cols; i += 2) {
        const seed = i * 137.5;
        const noiseSpeed = easing.perlinNoise1D(seed * 0.01, 1, i * 3) * 0.5 + 0.5;
        const speed = 0.5 + noiseSpeed;
        const y = ((time * speed * 50 + seed * 100) % (rows * charHeight)) - rows * charHeight / 2;

        for (let j = 0; j < 5; j++) {
          const charY = y + j * charHeight;
          if (charY > -availHeight / 2 && charY < availHeight / 2) {
            const noiseChar = easing.perlinNoise1D(time * 3 + seed * 0.01 + j * 0.5, 1, i * 7 + j);
            const charIndex = Math.floor(noiseChar * chars.length);
            const alpha = (1 - j / 5) * 0.3 * (1 - eased * 0.5);

            const matrixGradColors = [palettes.matrix[4], palettes.matrix[5], '#ffffff'];
            ctx.fillStyle = colorUtils.lerpColor(palettes.matrix[4], palettes.matrix[5], j / 5);
            ctx.globalAlpha = alpha;
            ctx.fillText(chars[charIndex], (i - cols / 2) * charWidth, charY);
          }
        }
      }
      ctx.restore();
    }

    const mainFontSize = adaptiveLayout.calculateFontSize(ctx, text, availWidth * 0.8, availHeight * 0.5);

    const microGlitch = easing.perlinNoise1D(time * 8, 2, 0) * 0.005 * (1 - eased);

    drawUtils.multiLayerGlow(ctx, 0, 0, glowColor, mainFontSize * 1.2, 5);

    ctx.save();
    ctx.font = `bold ${mainFontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    const fillChars = charSet === 'complex' ? EXTENDED_ASCII : ASCII_CHARS;
    const fillProgress = Math.floor(eased * text.length);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') continue;

      const charX = (i - text.length / 2 + 0.5) * (textWidth / text.length);
      const isRevealed = i < fillProgress;

      const noiseChar = easing.perlinNoise1D(time * 3 + i * 0.7, 1, i * 5);
      const asciiChar = fillChars[Math.floor(noiseChar * fillChars.length)];

      if (isRevealed) {
        const colorT = i / Math.max(1, text.length - 1);
        const bgGradColors = [
          colorUtils.lerpColor(palettes.matrix[3], palettes.matrix[4], colorT),
          colorUtils.lerpColor(palettes.matrix[4], palettes.matrix[5], colorT),
          colorUtils.lerpColor(palettes.matrix[5], '#ffffff', colorT * 0.3),
        ];

        ctx.save();
        ctx.globalAlpha = 0.3 + easing.perlinNoise1D(time * 1.5 + i * 0.3, 1, i * 3) * 0.1;
        drawUtils.gradientText(ctx, asciiChar, charX + microGlitch * textWidth, 0, bgGradColors, 135 + i * 15);
        ctx.restore();
      } else {
        if (easing.perlinNoise1D(time * 5 + i * 0.9, 1, i * 11) > 0.95) {
          ctx.save();
          ctx.fillStyle = colorUtils.lerpColor(glowColor, '#ffffff', 0.3);
          ctx.globalAlpha = 0.5;
          ctx.fillText(asciiChar, charX, 0);
          ctx.restore();
        }
      }
    }
    ctx.restore();

    ctx.save();
    ctx.font = `bold ${mainFontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const mainGradColors = [palettes.matrix[4], palettes.matrix[5], colorUtils.lerpColor(palettes.matrix[5], '#ffffff', 0.3)];
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowIntensity * eased * 0.5;
    drawUtils.gradientText(ctx, text, 0, 0, mainGradColors, 135);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = eased * 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, -1);

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = eased * 0.3;
    ctx.strokeText(text, 0, 0);
    ctx.restore();

    if (scanLine) {
      ctx.save();
      const scanY = ((time * 100) % availHeight) - availHeight / 2;

      drawUtils.lightBeam(ctx, -availWidth / 2, scanY, availWidth / 2, scanY, glowColor, 2, 0.4, 12);

      const scanRgb = colorUtils.hexToRgb(glowColor);
      ctx.fillStyle = colorUtils.withAlpha(scanRgb.r, scanRgb.g, scanRgb.b, 0.06);
      ctx.fillRect(-availWidth / 2, scanY - 20, availWidth, 20);

      ctx.restore();
    }

    ctx.save();
    const cornerSize = 30;
    const cornerRgb = colorUtils.hexToRgb(glowColor);
    ctx.strokeStyle = colorUtils.withAlpha(cornerRgb.r, cornerRgb.g, cornerRgb.b, 0.3 * eased);
    ctx.lineWidth = 1.5;

    drawUtils.lightBeam(ctx, -availWidth / 2 + 10, -availHeight / 2 + cornerSize, -availWidth / 2 + 10, -availHeight / 2 + 10, glowColor, 1, 0.3 * eased, 6);
    drawUtils.lightBeam(ctx, -availWidth / 2 + 10, -availHeight / 2 + 10, -availWidth / 2 + cornerSize, -availHeight / 2 + 10, glowColor, 1, 0.3 * eased, 6);

    drawUtils.lightBeam(ctx, availWidth / 2 - 10, availHeight / 2 - cornerSize, availWidth / 2 - 10, availHeight / 2 - 10, glowColor, 1, 0.3 * eased, 6);
    drawUtils.lightBeam(ctx, availWidth / 2 - 10, availHeight / 2 - 10, availWidth / 2 - cornerSize, availHeight / 2 - 10, glowColor, 1, 0.3 * eased, 6);
    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'MATRIX',
    textColor: '#00ff41',
    bgColor: '#000000',
    glowColor: '#00ff41',
    glowIntensity: 25,
    charSet: 'simple',
    matrixEffect: true,
    scanLine: true,
    revealSpeed: 1
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
