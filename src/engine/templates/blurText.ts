import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

export const blurTextTemplate: TemplateDefinition = {
  id: 'text_blur',
  name: '模糊文字',
  description: '文字从模糊到清晰的聚焦动画效果',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'FOCUS',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'textColor',
      label: '文字颜色',
      type: 'color',
      default: '#ffffff'
    },
    {
      key: 'glowColor',
      label: '发光颜色',
      type: 'color',
      default: '#00d4ff'
    },
    {
      key: 'maxBlur',
      label: '最大模糊度',
      type: 'number',
      default: 20,
      min: 5,
      max: 50,
      step: 1
    },
    {
      key: 'animationDuration',
      label: '动画时长比例',
      type: 'number',
      default: 0.6,
      min: 0.1,
      max: 1,
      step: 0.05
    },
    {
      key: 'pulseAfterFocus',
      label: '聚焦后脉冲',
      type: 'boolean',
      default: true
    },
    {
      key: 'pulseIntensity',
      label: '脉冲强度',
      type: 'number',
      default: 20,
      min: 0,
      max: 50,
      step: 5
    },
    {
      key: 'shadowBlur',
      label: '阴影模糊',
      type: 'number',
      default: 30,
      min: 0,
      max: 100,
      step: 5
    },
    {
      key: 'showSubtitle',
      label: '显示副标题',
      type: 'boolean',
      default: true
    },
    {
      key: 'subtitle',
      label: '副标题内容',
      type: 'string',
      default: 'Keep your eyes on the target',
      placeholder: '输入副标题文字'
    },
    {
      key: 'subtitleColor',
      label: '副标题颜色',
      type: 'color',
      default: '#888888'
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const text = paramGuard.string(params.text, 'FOCUS');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const maxBlur = paramGuard.number(params.maxBlur, 20, 5, 50);
    const animationDuration = paramGuard.number(params.animationDuration, 0.6, 0.1, 1);
    const pulseAfterFocus = paramGuard.boolean(params.pulseAfterFocus, true);
    const pulseIntensity = paramGuard.number(params.pulseIntensity, 20, 0, 50);
    const shadowBlur = paramGuard.number(params.shadowBlur, 30, 0, 100);
    const showSubtitle = paramGuard.boolean(params.showSubtitle, true);
    const subtitle = paramGuard.string(params.subtitle, 'Keep your eyes on the target');
    const subtitleColor = paramGuard.color(params.subtitleColor, '#888888');

    const p = paramGuard.number(progress, 0, 0, 1);

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);

    ctx.save();
    ctx.fillStyle = '#060612';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.dream.slice(0, 4), time * 0.25, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    const mainFontSize = adaptiveLayout.calculateFontSize(
      ctx,
      text,
      availSize.width,
      availSize.height * 0.6,
      1
    );

    let blurProgress: number;
    let focusComplete = false;

    if (p < animationDuration) {
      const rawBlur = p / animationDuration;
      const springBlur = easing.spring(rawBlur, 200, 16, 1);
      blurProgress = 1 - springBlur;
      blurProgress = Math.max(0, Math.min(1, blurProgress));
    } else {
      blurProgress = 0;
      focusComplete = true;
    }

    const currentBlur = maxBlur * blurProgress;

    let currentGlowIntensity = shadowBlur * (1 - blurProgress);

    if (focusComplete && pulseAfterFocus) {
      const focusTime = (p - animationDuration) / (1 - animationDuration);
      const pulseWobble = easing.dampedOscillation(focusTime, 5, 0.2);
      currentGlowIntensity += pulseIntensity * Math.abs(pulseWobble);
    }

    const breathe = easing.perlinNoise1D(time * 0.8, 1, 0) * 0.02;

    const dreamGradColors = [palettes.dream[0], palettes.dream[2], palettes.dream[4]];

    ctx.save();

    const scale = 1 + (blurProgress * 0.1) + breathe;
    ctx.scale(scale, scale);

    if (currentGlowIntensity > 0) {
      drawUtils.multiLayerGlow(ctx, 0, -availSize.height * 0.1, glowColor, mainFontSize * 1.5, 5);
    }

    ctx.save();
    ctx.font = `bold ${mainFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const alpha = 0.3 + 0.7 * (1 - blurProgress);
    ctx.globalAlpha = alpha;

    if (currentGlowIntensity > 0) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = currentGlowIntensity;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    drawUtils.gradientText(ctx, text, 0, -availSize.height * 0.1, dreamGradColors, 135);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = alpha * 0.2;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, -availSize.height * 0.1 - 1);
    ctx.restore();

    ctx.restore();

    if (blurProgress > 0.1 && blurProgress < 0.9) {
      const lineOpacity = Math.sin((1 - blurProgress) * Math.PI) * 0.5;
      const lineWidth = availSize.width * (0.5 + blurProgress * 0.5);

      ctx.save();
      drawUtils.lightBeam(ctx, -lineWidth / 2, -mainFontSize * 0.8, lineWidth / 2, -mainFontSize * 0.8, glowColor, 2, lineOpacity, 15);
      drawUtils.lightBeam(ctx, -lineWidth / 2, mainFontSize * 0.4, lineWidth / 2, mainFontSize * 0.4, glowColor, 2, lineOpacity, 15);
      ctx.restore();
    }

    if (showSubtitle) {
      const subtitleDelay = animationDuration * 0.5;
      let subtitleProgress = 0;

      if (p > subtitleDelay) {
        subtitleProgress = Math.min(1, (p - subtitleDelay) / (animationDuration - subtitleDelay));
        subtitleProgress = easing.snapSpring(subtitleProgress, 280, 26);
      }

      if (subtitleProgress > 0) {
        const subtitleFontSize = mainFontSize * 0.25;

        ctx.save();
        ctx.font = `${subtitleFontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = subtitleProgress;

        const subGradColors = [subtitleColor, colorUtils.lerpColor(subtitleColor, glowColor, 0.3)];
        drawUtils.gradientText(ctx, subtitle, 0, mainFontSize * 0.6, subGradColors, 90);

        const subtitleOffset = easing.perlinNoise1D(time * 0.6, 1, 100) * 2;
        ctx.restore();
      }
    }

    if (focusComplete) {
      const focusTime = (p - animationDuration) / (1 - animationDuration);
      const shimmerP = (time * 0.2) % 1;
      ctx.save();
      ctx.globalAlpha = 0.25 * (1 - focusTime * 0.5);
      drawUtils.shimmerLine(ctx, -availSize.width * 0.4, -mainFontSize * 0.6, availSize.width * 0.8, mainFontSize * 1.2, shimmerP, glowColor, 0.3);
      ctx.restore();
    }
  },

  initParams: (duration: number) => ({
    text: 'FOCUS',
    textColor: '#ffffff',
    glowColor: '#00d4ff',
    maxBlur: 20,
    animationDuration: 0.6,
    pulseAfterFocus: true,
    pulseIntensity: 20,
    shadowBlur: 30,
    showSubtitle: true,
    subtitle: 'Keep your eyes on the target',
    subtitleColor: '#888888'
  })
};
