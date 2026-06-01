import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, palettes, animationUtils } from './templateUtils';

export const textPressureTemplate: TemplateDefinition = {
  id: 'text_pressure',
  name: '文字压力效果',
  description: '文字被挤压和拉伸的压力效果，带有弹性动画和发光增强',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '显示文字',
      type: 'string',
      default: 'PRESSURE',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'textColor',
      label: '文字颜色',
      type: 'color',
      default: '#ff6b6b'
    },
    {
      key: 'bgColor',
      label: '背景颜色',
      type: 'color',
      default: '#1a1a2e'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#ff6b6b'
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
      key: 'pressureAmount',
      label: '压力强度',
      type: 'number',
      default: 0.3,
      min: 0,
      max: 0.8,
      step: 0.05
    },
    {
      key: 'elasticity',
      label: '弹性系数',
      type: 'number',
      default: 1,
      min: 0.5,
      max: 2,
      step: 0.1
    },
    {
      key: 'enableShake',
      label: '启用震动',
      type: 'boolean',
      default: true
    },
    {
      key: 'shakeIntensity',
      label: '震动强度',
      type: 'number',
      default: 3,
      min: 0,
      max: 10,
      step: 1
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const { width: availWidth, height: availHeight } =
      adaptiveLayout.getAvailableSize(width, height, 0.95);

    const text = paramGuard.string(params.text, 'PRESSURE');
    const textColor = paramGuard.color(params.textColor, '#ff6b6b');
    const bgColor = paramGuard.color(params.bgColor, '#1a1a2e');
    const glowColor = paramGuard.color(params.glowColor, '#ff6b6b');
    const glowIntensity = paramGuard.number(params.glowIntensity, 35, 0, 100);
    const pressureAmount = paramGuard.number(params.pressureAmount, 0.3, 0, 0.8);
    const elasticity = paramGuard.number(params.elasticity, 1, 0.5, 2);
    const enableShake = paramGuard.boolean(params.enableShake, true);
    const shakeIntensity = paramGuard.number(params.shakeIntensity, 3, 0, 10);

    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.save();
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.ember.slice(3, 6), time * 0.2, 0.2);
    drawUtils.vignette(ctx, width, height, 0.55);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    const squeezePhase = Math.min(1, p / 0.3);
    const squeezeEased = easing.easeInCubic(squeezePhase);

    const bouncePhase = p > 0.3 ? Math.min(1, (p - 0.3) / 0.3) : 0;
    const bounceEased = easing.spring(bouncePhase, 180 * elasticity, 14, 1);

    const stablePhase = p > 0.6 ? Math.min(1, (p - 0.6) / 0.4) : 0;
    const stableEased = easing.easeOutCubic(stablePhase);

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx, text, availWidth, availHeight
    );

    const squeezeScaleX = 1 - pressureAmount * squeezeEased;
    const squeezeScaleY = 1 + pressureAmount * 0.5 * squeezeEased;

    const bounceScaleX = squeezeScaleX + (1 - squeezeScaleX) * bounceEased;
    const bounceScaleY = squeezeScaleY - (squeezeScaleY - 1) * bounceEased;

    const microWobble = easing.dampedOscillation(stablePhase * 3, 5, 0.2) * 0.01 * (1 - stableEased);
    const finalScaleX = bounceScaleX + microWobble;
    const finalScaleY = bounceScaleY - microWobble;

    let shakeX = 0;
    let shakeY = 0;
    if (enableShake && p < 0.6) {
      const shakeProgress = 1 - p / 0.6;
      shakeX = easing.perlinNoise1D(time * 25, 3, 1) * shakeIntensity * shakeProgress;
      shakeY = easing.perlinNoise1D(time * 25 + 50, 3, 2) * shakeIntensity * shakeProgress;
    }

    const pressureGlow = glowIntensity * (1 + squeezeEased * 0.5);
    const currentGlow = pressureGlow * (0.8 + Math.abs(easing.dampedOscillation(time * 1.5, 2, 0.15)) * 0.2);

    drawUtils.multiLayerGlow(ctx, shakeX, shakeY, glowColor, fontSize * 1.5, 5);

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.scale(finalScaleX, finalScaleY);

    const pal = palettes.ember;
    const pressGradColors = [pal[4], pal[5], colorUtils.lerpColor(pal[5], '#ffffff', 0.3)];

    ctx.save();
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = colorUtils.toRgba(glowColor, 0.6);
    ctx.shadowBlur = 20 * squeezeEased;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10 * squeezeEased;

    drawUtils.gradientText(ctx, text, 0, 0, pressGradColors, 180);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, -1);
    ctx.restore();

    if (squeezeEased > 0.1) {
      ctx.save();
      ctx.strokeStyle = colorUtils.toRgba(glowColor, 0.5 * squeezeEased);
      ctx.lineWidth = 2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10 * squeezeEased;
      ctx.strokeText(text, 0, 0);
      ctx.restore();
    }

    drawUtils.specularHighlight(ctx, -fontSize * text.length * 0.3, -fontSize * 0.5, fontSize * text.length * 0.6, fontSize, fontSize * 0.15, 0.1 * (1 - squeezeEased * 0.5));

    ctx.restore();

    if (squeezeEased > 0.1) {
      ctx.save();
      const rippleCount = 3;
      for (let i = 0; i < rippleCount; i++) {
        const rippleProgress = (squeezeEased + i * 0.2) % 1;
        const rippleScale = 1 + rippleProgress * 0.5;
        const rippleAlpha = 1 - rippleProgress;

        const rippleWobble = easing.dampedOscillation(rippleProgress * 3, 4, 0.25) * 0.05;
        const rippleRgb = colorUtils.hexToRgb(glowColor);
        ctx.strokeStyle = colorUtils.withAlpha(rippleRgb.r, rippleRgb.g, rippleRgb.b, rippleAlpha * 0.3);
        ctx.lineWidth = 2 - i * 0.5;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 * rippleAlpha;
        ctx.beginPath();
        ctx.ellipse(
          0, 0,
          availWidth * 0.4 * rippleScale * (1 + rippleWobble),
          availHeight * 0.2 * rippleScale * (1 - rippleWobble),
          0, 0, Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    if (squeezeEased > 0.3) {
      ctx.save();
      const particleCount = 6;
      for (let i = 0; i < particleCount; i++) {
        const pAngle = (i / particleCount) * Math.PI * 2 + time * 0.5;
        const pDist = fontSize * (0.8 + squeezeEased * 0.5);
        const px = Math.cos(pAngle) * pDist;
        const py = Math.sin(pAngle) * pDist * 0.5;
        const pAlpha = squeezeEased * 0.4 * easing.perlinNoise1D(time * 2 + i * 3.7, 1, i * 5);
        drawUtils.particle(ctx, px, py, 5, glowColor, pAlpha, 0.6);
      }
      ctx.restore();
    }

    ctx.save();
    const cornerSize = Math.min(availWidth, availHeight) * 0.05;
    const cornerRgb = colorUtils.hexToRgb(glowColor);
    ctx.strokeStyle = colorUtils.withAlpha(cornerRgb.r, cornerRgb.g, cornerRgb.b, 0.4 * p);
    ctx.lineWidth = 1.5;

    drawUtils.lightBeam(ctx, -availWidth / 2 + 20, -availHeight / 2 + cornerSize, -availWidth / 2 + 20, -availHeight / 2 + 20, glowColor, 1, 0.3 * p, 6);
    drawUtils.lightBeam(ctx, -availWidth / 2 + 20, -availHeight / 2 + 20, -availWidth / 2 + cornerSize, -availHeight / 2 + 20, glowColor, 1, 0.3 * p, 6);

    drawUtils.lightBeam(ctx, availWidth / 2 - 20, availHeight / 2 - cornerSize, availWidth / 2 - 20, availHeight / 2 - 20, glowColor, 1, 0.3 * p, 6);
    drawUtils.lightBeam(ctx, availWidth / 2 - 20, availHeight / 2 - 20, availWidth / 2 - cornerSize, availHeight / 2 - 20, glowColor, 1, 0.3 * p, 6);
    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'PRESSURE',
    textColor: '#ff6b6b',
    bgColor: '#1a1a2e',
    glowColor: '#ff6b6b',
    glowIntensity: 35,
    pressureAmount: 0.3,
    elasticity: 1,
    enableShake: true,
    shakeIntensity: 3
  }),

  validateParams: (params: Record<string, any>) => {
    return params.text && params.text.length > 0;
  }
};
