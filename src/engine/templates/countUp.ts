import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, palettes, animationUtils } from './templateUtils';

export const countUpTemplate: TemplateDefinition = {
  id: 'effect_count_up',
  name: '数字递增',
  description: '数字递增动画效果，使用动量物理实现自然的数字滚动',
  category: 'effect',
  schema: [
    { key: 'startValue', label: '起始值', type: 'number', default: 0, min: 0, max: 1000000, step: 1 },
    { key: 'endValue', label: '结束值', type: 'number', default: 100, min: 0, max: 1000000, step: 1 },
    { key: 'fontSize', label: '字体大小', type: 'number', default: 72, min: 24, max: 200, step: 4 },
    { key: 'fontColor', label: '字体颜色', type: 'color', default: '#ffffff' },
    { key: 'glowColor', label: '发光颜色', type: 'color', default: '#00d4ff' },
    { key: 'glowIntensity', label: '发光强度', type: 'number', default: 20, min: 0, max: 50, step: 5 },
    { key: 'prefix', label: '前缀', type: 'string', default: '' },
    { key: 'suffix', label: '后缀', type: 'string', default: '' },
    { key: 'decimals', label: '小数位数', type: 'number', default: 0, min: 0, max: 4, step: 1 },
    { key: 'mass', label: '动量质量', type: 'number', default: 1.2, min: 0.5, max: 3, step: 0.1 },
    { key: 'friction', label: '摩擦力', type: 'number', default: 0.2, min: 0.05, max: 0.5, step: 0.05 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const { width: availWidth, height: availHeight } =
      adaptiveLayout.getAvailableSize(width, height, 0.95);

    const startValue = paramGuard.number(params.startValue, 0, 0, 1000000);
    const endValue = paramGuard.number(params.endValue, 100, 0, 1000000);
    const fontSize = paramGuard.number(params.fontSize, 72, 24, 200);
    const fontColor = paramGuard.color(params.fontColor, '#ffffff');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const glowIntensity = paramGuard.number(params.glowIntensity, 20, 0, 50);
    const prefix = paramGuard.string(params.prefix, '');
    const suffix = paramGuard.string(params.suffix, '');
    const decimals = paramGuard.number(params.decimals, 0, 0, 4);
    const mass = paramGuard.number(params.mass, 1.2, 0.5, 3);
    const friction = paramGuard.number(params.friction, 0.2, 0.05, 0.5);

    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.save();
    ctx.fillStyle = '#050510';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.neon.slice(1, 5), time * 0.25, 0.18);
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    const momentumEased = easing.momentumEase(p, mass, friction);

    const currentValue = startValue + (endValue - startValue) * momentumEased;

    const displayValue = currentValue.toFixed(decimals);

    const text = `${prefix}${displayValue}${suffix}`;

    const enterEased = easing.spring(Math.min(1, p / 0.3), 120, 14, 1);

    const settleOsc = easing.dampedOscillation(p * 5, 2, 0.2) * 3 * (1 - p);

    drawUtils.multiLayerGlow(ctx, 0, settleOsc, glowColor, fontSize * 1.5, 5);

    const numGradColors = [palettes.neon[0], palettes.neon[2], palettes.neon[4]];

    ctx.save();
    ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = enterEased;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowIntensity * enterEased;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = fontSize * 0.04;

    ctx.translate(0, settleOsc);

    drawUtils.gradientText(ctx, text, 0, 0, numGradColors, 135);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = enterEased * 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, -1);

    ctx.restore();

    if (p > 0.1 && p < 0.9) {
      const digitCount = displayValue.length;
      const digitWidth = fontSize * 0.6;

      for (let i = 0; i < digitCount; i++) {
        const char = displayValue[i];
        if (char >= '0' && char <= '9') {
          const digitProgress = (p - 0.1) / 0.8;
          const digitOsc = easing.dampedOscillation(digitProgress * 8 + i * 0.5, 3, 0.3) * 5 * (1 - digitProgress);

          const x = (i - digitCount / 2 + 0.5) * digitWidth;

          ctx.save();
          ctx.globalAlpha = 0.08 * (1 - digitProgress);
          ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const ghostRgb = colorUtils.hexToRgb(glowColor);
          ctx.fillStyle = colorUtils.withAlpha(ghostRgb.r, ghostRgb.g, ghostRgb.b, 0.15);
          ctx.fillText(char, x, digitOsc);
          ctx.restore();
        }
      }
    }

    if (p < 0.5) {
      const sparkAlpha = (1 - p * 2) * 0.6;
      const sparkCount = 8;

      for (let i = 0; i < sparkCount; i++) {
        const seed = i * 73.3;
        const angle = (seed % 360) * (Math.PI / 180);
        const distance = fontSize * 0.8 * easing.spring(p * 2, 100, 12, 1);

        const sx = Math.cos(angle) * distance;
        const sy = Math.sin(angle) * distance;

        const sparkColor = palettes.neon[i % palettes.neon.length];
        drawUtils.particle(ctx, sx, sy, 5, sparkColor, sparkAlpha * enterEased, 0.6);
      }
    }

    const pulseIntensity = Math.abs(easing.dampedOscillation(p * 4, 3, 0.25));
    if (pulseIntensity > 0.05 && p > 0.1 && p < 0.9) {
      ctx.save();
      drawUtils.radialGlow(ctx, 0, settleOsc, fontSize * 2, glowColor, pulseIntensity * 0.15);
      ctx.restore();
    }

    ctx.save();
    const shimmerP = (time * 0.3) % 1;
    ctx.globalAlpha = 0.15 * enterEased;
    drawUtils.shimmerLine(ctx, -availWidth * 0.4, -fontSize * 0.6, availWidth * 0.8, fontSize * 1.2, shimmerP, glowColor, 0.3);
    ctx.restore();
  },

  initParams: () => ({
    startValue: 0,
    endValue: 100,
    fontSize: 72,
    fontColor: '#ffffff',
    glowColor: '#00d4ff',
    glowIntensity: 20,
    prefix: '',
    suffix: '',
    decimals: 0,
    mass: 1.2,
    friction: 0.2
  })
};
