import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, palettes, colorUtils, animationUtils } from './templateUtils';

const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export const decryptedTextTemplate: TemplateDefinition = {
  id: 'text_decrypted',
  name: '解密文字',
  description: '从乱码逐渐解密为正确文字的动画效果',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'DECRYPTED',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'color',
      label: '文字颜色',
      type: 'color',
      default: '#00ff88'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#00ff88'
    },
    {
      key: 'decryptSpeed',
      label: '解密速度',
      type: 'number',
      default: 1.5,
      min: 0.5,
      max: 3,
      step: 0.1
    },
    {
      key: 'glitchIntensity',
      label: '乱码强度',
      type: 'number',
      default: 0.8,
      min: 0.3,
      max: 1,
      step: 0.1
    },
    {
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 30,
      min: 10,
      max: 60,
      step: 5
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const text = paramGuard.string(params.text, 'DECRYPTED');
    const color = paramGuard.color(params.color, '#00ff88');
    const glowColor = paramGuard.color(params.glowColor, '#00ff88');
    const decryptSpeed = paramGuard.number(params.decryptSpeed, 1.5, 0.5, 3);
    const glitchIntensity = paramGuard.number(params.glitchIntensity, 0.8, 0.3, 1);
    const glowIntensity = paramGuard.number(params.glowIntensity, 30, 10, 60);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availSize.width, availSize.height
    );

    ctx.save();
    ctx.fillStyle = '#040410';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.cyberpunk.slice(2, 5), time * 0.3, 0.18);
    drawUtils.vignette(ctx, width, height, 0.55);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.03, time);
    ctx.restore();

    const scanLineOffset = (time * 3) % (fontSize * 2);

    const exitProgress = p > 0.8 ? (p - 0.8) / 0.2 : 0;
    const exitAlpha = 1 - easing.easeInCubic(exitProgress);

    const decryptProgress = Math.min(1, p * decryptSpeed);

    const getDisplayChar = (char: string, index: number, progress: number): string => {
      const charProgress = Math.max(0, Math.min(1, (progress * text.length - index)));

      if (charProgress >= 1) {
        return char;
      }

      const noiseVal = easing.perlinNoise1D(time * 8 + index * 0.5, 2, index * 7);
      const randomThreshold = 1 - charProgress;
      if (noiseVal < randomThreshold * glitchIntensity) {
        const charIndex = Math.floor(easing.perlinNoise1D(time * 12 + index * 0.3, 1, index * 13) * RANDOM_CHARS.length);
        return RANDOM_CHARS[charIndex];
      }

      return char;
    };

    let displayText = '';
    for (let i = 0; i < text.length; i++) {
      displayText += getDisplayChar(text[i], i, decryptProgress);
    }

    const pal = palettes.cyberpunk;

    drawUtils.multiLayerGlow(ctx, 0, 0, glowColor, fontSize * 1.2, 5);

    ctx.save();
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = eased * exitAlpha;

    const textWobble = easing.dampedOscillation(p, 3, 0.15) * fontSize * 0.01;

    const decryptGradColors = [pal[3], pal[4], pal[5]];
    drawUtils.gradientText(ctx, displayText, 0, textWobble, decryptGradColors, 135);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = eased * exitAlpha * 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayText, 0, textWobble - 1);
    ctx.restore();

    ctx.save();
    const scanRgb = colorUtils.hexToRgb(glowColor);
    const scanGrad = ctx.createLinearGradient(-fontSize * text.length * 0.3, 0, fontSize * text.length * 0.3, 0);
    scanGrad.addColorStop(0, colorUtils.withAlpha(scanRgb.r, scanRgb.g, scanRgb.b, 0));
    scanGrad.addColorStop(0.5, colorUtils.withAlpha(scanRgb.r, scanRgb.g, scanRgb.b, 0.4 * eased * exitAlpha));
    scanGrad.addColorStop(1, colorUtils.withAlpha(scanRgb.r, scanRgb.g, scanRgb.b, 0));
    ctx.strokeStyle = scanGrad;
    ctx.lineWidth = 2;
    const scanWobble = easing.perlinNoise1D(time * 2, 1, 50) * 3;
    ctx.beginPath();
    ctx.moveTo(-fontSize * text.length * 0.3, -fontSize * 0.5 + scanLineOffset + scanWobble);
    ctx.lineTo(fontSize * text.length * 0.3, -fontSize * 0.5 + scanLineOffset + scanWobble);
    ctx.stroke();
    ctx.restore();

    if (decryptProgress < 1) {
      ctx.save();
      ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const decryptedCount = Math.floor(decryptProgress * text.length);
      if (decryptedCount > 0 && decryptedCount < text.length) {
        const decryptedPart = text.substring(0, decryptedCount);
        const metrics = ctx.measureText(decryptedPart);
        const totalMetrics = ctx.measureText(text);
        const startX = -totalMetrics.width / 2;
        const highlightX = startX + metrics.width;

        const cursorPulse = easing.dampedOscillation(time * 5, 8, 0.2);
        drawUtils.multiLayerGlow(ctx, highlightX, 0, glowColor, fontSize * 0.5, 4);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = (0.5 + cursorPulse * 0.3) * eased * exitAlpha;
        ctx.fillRect(highlightX - 2, -fontSize * 0.4, 4, fontSize * 0.8);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.font = `${fontSize * 0.3}px 'Courier New', monospace`;
    const bgCharRgb = colorUtils.hexToRgb(glowColor);
    ctx.fillStyle = colorUtils.withAlpha(bgCharRgb.r, bgCharRgb.g, bgCharRgb.b, 0.08 * eased * exitAlpha);
    ctx.textAlign = 'left';

    for (let i = 0; i < 20; i++) {
      const seed = i * 137.5;
      const x = (easing.perlinNoise1D(seed * 0.01 + time * 0.5, 1, i * 3) - 0.5) * availSize.width;
      const y = ((time * 50 + seed * 10) % availSize.height) - availSize.height / 2;
      const charIndex = Math.floor(easing.perlinNoise1D(seed * 0.02 + time * 3, 1, i * 7) * RANDOM_CHARS.length);
      ctx.fillText(RANDOM_CHARS[charIndex], x, y);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.06 * eased * exitAlpha;
    const scanlineCount = Math.floor(height / 3);
    for (let i = 0; i < scanlineCount; i++) {
      const sy = -height / 2 + i * 3;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-width / 2, sy, width, 1);
    }
    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'DECRYPTED',
    color: '#00ff88',
    glowColor: '#00ff88',
    decryptSpeed: 1.5,
    glitchIntensity: 0.8,
    glowIntensity: 30
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
