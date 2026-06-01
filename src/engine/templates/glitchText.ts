import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#________';

export const glitchTextTemplate: TemplateDefinition = {
  id: 'text_glitch',
  name: '故障文字',
  description: '带有数字故障和RGB分离效果的文字动画',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'GLITCH',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'mainColor',
      label: '主色',
      type: 'color',
      default: '#ffffff'
    },
    {
      key: 'glitchColor1',
      label: '故障色1',
      type: 'color',
      default: '#ff003c'
    },
    {
      key: 'glitchColor2',
      label: '故障色2',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'glitchIntensity',
      label: '故障强度',
      type: 'number',
      default: 0.7,
      min: 0.2,
      max: 1,
      step: 0.1
    },
    {
      key: 'glitchSpeed',
      label: '故障速度',
      type: 'number',
      default: 8,
      min: 3,
      max: 15,
      step: 1
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const text = paramGuard.string(params.text, 'GLITCH');
    const mainColor = paramGuard.color(params.mainColor, '#ffffff');
    const glitchColor1 = paramGuard.color(params.glitchColor1, '#ff003c');
    const glitchColor2 = paramGuard.color(params.glitchColor2, '#00d4ff');
    const glitchIntensity = paramGuard.number(params.glitchIntensity, 0.7, 0.2, 1);
    const glitchSpeed = paramGuard.number(params.glitchSpeed, 8, 3, 15);

    const p = paramGuard.number(progress, 0, 0, 1);
    const eased = easing.easeOutCubic(p);

    ctx.save();
    ctx.fillStyle = '#08080f';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, [palettes.cyberpunk[0], palettes.cyberpunk[4], palettes.cyberpunk[5]], time * 0.4, 0.2);
    drawUtils.vignette(ctx, width, height, 0.55);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.04, time);
    ctx.restore();

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availSize.width, availSize.height
    );

    const noiseVal = easing.perlinNoise1D(time * glitchSpeed * 0.3, 3, 0);
    const noiseVal2 = easing.perlinNoise1D(time * glitchSpeed * 0.3 + 100, 3, 50);
    const glitchTrigger = noiseVal * noiseVal2;
    const isGlitching = glitchTrigger > (1 - glitchIntensity) * 0.5;

    const microShake = isGlitching
      ? easing.perlinNoise1D(time * 30, 5, 1) * fontSize * 0.03 * glitchIntensity
      : 0;

    const enterProgress = Math.min(1, p / 0.4);
    const enterScale = easing.spring(enterProgress, 150, 14, 1);

    const exitProgress = p > 0.75 ? (p - 0.75) / 0.25 : 0;
    const exitAlpha = 1 - easing.easeInCubic(exitProgress);

    ctx.save();
    ctx.scale(enterScale, enterScale);
    ctx.translate(microShake, microShake * 0.5);

    if (isGlitching) {
      const offset = fontSize * 0.04 * glitchIntensity;
      const rgbNoiseX = easing.perlinNoise1D(time * 15, 4, 2) * offset;
      const rgbNoiseY = easing.perlinNoise1D(time * 15 + 50, 4, 3) * offset * 0.5;

      ctx.save();
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.6 * eased * exitAlpha;
      ctx.translate(-rgbNoiseX * 1.5, -rgbNoiseY * 1.5);
      drawUtils.neonText(ctx, text, 0, 0, glitchColor1, 0.8);
      ctx.restore();

      ctx.save();
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.6 * eased * exitAlpha;
      ctx.translate(rgbNoiseX * 1.5, rgbNoiseY * 1.5);
      drawUtils.neonText(ctx, text, 0, 0, glitchColor2, 0.8);
      ctx.restore();
    }

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = eased * exitAlpha;
    const mainGradColors = [mainColor, colorUtils.lerpColor(mainColor, '#ff003c', 0.15), colorUtils.lerpColor(mainColor, '#00d4ff', 0.15)];
    drawUtils.gradientText(ctx, text, 0, 0, mainGradColors, 135);
    ctx.restore();

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = eased * exitAlpha;
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 25 * eased;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText(text, 0, -1);
    ctx.restore();

    if (isGlitching) {
      const stripeCount = Math.floor(3 + glitchIntensity * 5);
      ctx.save();
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < stripeCount; i++) {
        const seed = i * 73.3 + time * 100;
        const yOffset = (easing.perlinNoise1D(seed * 0.01, 1, i * 5) * 2 - 1) * fontSize * 0.5;
        const xShift = easing.perlinNoise1D(seed * 0.02, 1, i * 7 + 100) * fontSize * 0.1 * glitchIntensity;
        const stripeHeight = fontSize * (0.05 + easing.perlinNoise1D(seed * 0.03, 1, i * 11) * 0.1);

        ctx.save();
        ctx.translate(xShift, yOffset);
        const stripeColor = easing.perlinNoise1D(seed * 0.04, 1, i * 13) > 0.5 ? glitchColor1 : glitchColor2;
        ctx.fillStyle = stripeColor;
        ctx.globalAlpha = (0.3 + easing.perlinNoise1D(seed * 0.05, 1, i * 17) * 0.4) * eased * exitAlpha;

        ctx.beginPath();
        ctx.rect(-fontSize * text.length * 0.3, -stripeHeight / 2, fontSize * text.length * 0.6, stripeHeight);
        ctx.clip();
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    if (isGlitching && easing.perlinNoise1D(time * 10, 2, 200) < glitchIntensity) {
      ctx.save();
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const glitchCharCount = Math.floor(text.length * glitchIntensity * 0.5);
      for (let i = 0; i < glitchCharCount; i++) {
        const charIndex = Math.floor(easing.perlinNoise1D(time * 8 + i * 3.7, 1, i * 17) * text.length);
        const glitchChar = GLITCH_CHARS[Math.floor(easing.perlinNoise1D(time * 12 + i * 5.3, 1, i * 23) * GLITCH_CHARS.length)];
        const beforeText = text.substring(0, charIndex);
        const beforeMetrics = ctx.measureText(beforeText);
        const totalMetrics = ctx.measureText(text);
        const startX = -totalMetrics.width / 2;
        const x = startX + beforeMetrics.width + ctx.measureText(text[charIndex]).width / 2;
        const y = easing.perlinNoise1D(time * 6 + i * 2.1, 1, i * 31) * fontSize * 0.3;

        ctx.save();
        ctx.translate(x, y);
        const charColor = easing.perlinNoise1D(time * 4 + i * 1.7, 1, i * 37) > 0.5 ? glitchColor1 : glitchColor2;
        drawUtils.neonText(ctx, glitchChar, 0, 0, charColor, 0.6);
        ctx.globalAlpha = (0.5 + easing.perlinNoise1D(time * 5 + i * 2.3, 1, i * 41) * 0.5) * eased * exitAlpha;
        ctx.restore();
      }
      ctx.restore();
    }

    ctx.save();
    const scanLineY = ((time * 100) % (fontSize * 1.5)) - fontSize * 0.75;
    const scanRgb = colorUtils.hexToRgb(mainColor);
    const scanGrad = ctx.createLinearGradient(-fontSize * text.length * 0.35, scanLineY, fontSize * text.length * 0.35, scanLineY);
    scanGrad.addColorStop(0, colorUtils.withAlpha(scanRgb.r, scanRgb.g, scanRgb.b, 0));
    scanGrad.addColorStop(0.5, colorUtils.withAlpha(scanRgb.r, scanRgb.g, scanRgb.b, 0.4 * eased * exitAlpha));
    scanGrad.addColorStop(1, colorUtils.withAlpha(scanRgb.r, scanRgb.g, scanRgb.b, 0));
    ctx.strokeStyle = scanGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-fontSize * text.length * 0.35, scanLineY);
    ctx.lineTo(fontSize * text.length * 0.35, scanLineY);
    ctx.stroke();
    ctx.restore();

    if (isGlitching) {
      ctx.save();
      for (let i = 0; i < 30 * glitchIntensity; i++) {
        const x = (easing.perlinNoise1D(time * 20 + i * 0.7, 1, i * 43) - 0.5) * availSize.width;
        const y = (easing.perlinNoise1D(time * 20 + i * 0.7 + 50, 1, i * 47) - 0.5) * availSize.height;
        const pColor = easing.perlinNoise1D(time * 5 + i * 0.3, 1, i * 53) > 0.5 ? glitchColor1 : glitchColor2;
        const pAlpha = (0.3 + easing.perlinNoise1D(time * 8 + i * 0.9, 1, i * 59) * 0.5) * eased * exitAlpha;
        drawUtils.particle(ctx, x, y, 3 + easing.perlinNoise1D(time * 10 + i * 1.1, 1, i * 53) * 4, pColor, pAlpha, 0.7);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.08 * eased * exitAlpha;
    const scanlineCount = Math.floor(height / 3);
    for (let i = 0; i < scanlineCount; i++) {
      const sy = -height / 2 + i * 3;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-width / 2, sy, width, 1);
    }
    ctx.restore();

    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'GLITCH',
    mainColor: '#ffffff',
    glitchColor1: '#ff003c',
    glitchColor2: '#00d4ff',
    glitchIntensity: 0.7,
    glitchSpeed: 8
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
