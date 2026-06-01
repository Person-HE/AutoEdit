import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

export const splitTextTemplate: TemplateDefinition = {
  id: 'text_split',
  name: '分割文字',
  description: '文字逐字符分割动画，每个字符独立入场效果',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'HELLO WORLD',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'textColor',
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
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 30,
      min: 0,
      max: 100,
      step: 5
    },
    {
      key: 'charDelay',
      label: '字符延迟',
      type: 'number',
      default: 0.05,
      min: 0.01,
      max: 0.3,
      step: 0.01
    },
    {
      key: 'animationType',
      label: '动画类型',
      type: 'select',
      default: 'wave',
      options: [
        { label: '波浪', value: 'wave' },
        { label: '弹跳', value: 'bounce' },
        { label: '旋转', value: 'rotate' },
        { label: '缩放', value: 'scale' },
        { label: '淡入', value: 'fade' }
      ]
    },
    {
      key: 'randomOffset',
      label: '随机偏移',
      type: 'number',
      default: 50,
      min: 0,
      max: 200,
      step: 10
    },
    {
      key: 'microAnimation',
      label: '微动画',
      type: 'boolean',
      default: true
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const text = paramGuard.string(params.text, 'HELLO WORLD');
    const textColor = paramGuard.color(params.textColor, '#00d4ff');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const glowIntensity = paramGuard.number(params.glowIntensity, 30, 0, 100);
    const charDelay = paramGuard.number(params.charDelay, 0.05, 0.01, 0.3);
    const animationType = paramGuard.string(params.animationType, 'wave');
    const randomOffset = paramGuard.number(params.randomOffset, 50, 0, 200);
    const microAnimation = paramGuard.boolean(params.microAnimation, true);

    const p = paramGuard.number(progress, 0, 0, 1);

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);

    ctx.save();
    ctx.fillStyle = '#050510';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.aurora.slice(0, 4), time * 0.3, 0.25);
    drawUtils.vignette(ctx, width, height, 0.6);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    const chars = text.split('');

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx,
      text,
      availSize.width,
      availSize.height,
      1
    );

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const charWidths = chars.map(char => ctx.measureText(char).width);
    const totalWidth = charWidths.reduce((sum, w) => sum + w, 0) + (chars.length - 1) * fontSize * 0.1;

    let currentX = -totalWidth / 2;

    const pal = palettes.aurora;

    chars.forEach((char, index) => {
      const charStartTime = index * charDelay;
      const charDuration = 0.35;
      const charEndTime = charStartTime + charDuration;
      let charProgress = 0;

      if (p >= charEndTime) {
        charProgress = 1;
      } else if (p >= charStartTime) {
        charProgress = (p - charStartTime) / (charEndTime - charStartTime);
      }

      if (char === ' ') {
        currentX += charWidths[index] + fontSize * 0.1;
        return;
      }

      ctx.save();

      const charX = currentX + charWidths[index] / 2;
      let charY = 0;

      let scale = 1;
      let rotation = 0;
      let alpha = charProgress;
      let offsetY = 0;

      switch (animationType) {
        case 'wave':
          if (charProgress > 0 && charProgress < 1) {
            scale = easing.spring(charProgress, 120, 14, 1);
            offsetY = -randomOffset * 0.6 * (1 - easing.snapSpring(charProgress, 250, 28));
          } else if (charProgress >= 1) {
            scale = 1;
          }
          const waveWobble = easing.dampedOscillation(charProgress, 4, 0.15) * fontSize * 0.08;
          offsetY += waveWobble;
          break;
        case 'bounce':
          if (charProgress > 0 && charProgress < 1) {
            const bounceT = easing.gravityBounce(charProgress, 0.55, 12);
            scale = bounceT;
            offsetY = -randomOffset * (1 - easing.snapSpring(charProgress, 200, 24));
            const squash = 1 + easing.dampedOscillation(charProgress, 6, 0.25) * 0.12;
            scale *= squash;
          } else if (charProgress >= 1) {
            scale = 1;
          }
          break;
        case 'rotate':
          if (charProgress > 0 && charProgress < 1) {
            const springVal = easing.spring(charProgress, 100, 10, 1);
            rotation = (1 - springVal) * Math.PI * 2;
            scale = easing.snapSpring(charProgress, 280, 26);
          } else if (charProgress >= 1) {
            scale = 1;
          }
          break;
        case 'scale':
          if (charProgress > 0 && charProgress < 1) {
            scale = easing.spring(charProgress, 180, 12, 1);
          } else if (charProgress >= 1) {
            scale = 1;
          }
          break;
        case 'fade':
          if (charProgress > 0 && charProgress < 1) {
            alpha = easing.snapSpring(charProgress, 300, 30);
            const momentumOffset = easing.momentumEase(charProgress, 1.2, 0.5);
            offsetY = -randomOffset * 0.3 * (1 - momentumOffset);
          } else if (charProgress >= 1) {
            alpha = 1;
          }
          break;
      }

      if (microAnimation && charProgress >= 1) {
        const noiseVal = easing.perlinNoise1D(time * 0.8 + index * 0.3, 1.5, index * 7.3);
        charY += noiseVal * fontSize * 0.03;
      }

      ctx.translate(charX, charY + offsetY);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      if (alpha > 0) {
        const colorT = index / Math.max(1, chars.length - 1);
        const gradColors = [
          colorUtils.lerpColor(pal[0], pal[1], colorT),
          colorUtils.lerpColor(pal[1], pal[2], colorT),
          colorUtils.lerpColor(pal[2], pal[3], colorT),
        ];

        drawUtils.multiLayerGlow(ctx, 0, 0, glowColor, fontSize * 0.8, 5);

        ctx.save();
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = alpha;

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity * alpha * 0.6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = fontSize * 0.05;
        drawUtils.gradientText(ctx, char, 0, 0, gradColors, 135 + index * 15);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = alpha * 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(char, 0, -1);

        ctx.restore();
      }

      ctx.restore();

      currentX += charWidths[index] + fontSize * 0.1;
    });

    const shimmerProgress = (time * 0.3) % 1;
    ctx.save();
    ctx.globalAlpha = 0.3 * Math.min(1, p * 3);
    drawUtils.shimmerLine(ctx, -totalWidth / 2, -fontSize * 0.6, totalWidth, fontSize * 1.2, shimmerProgress, '#ffffff', 0.4);
    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'HELLO WORLD',
    textColor: '#00d4ff',
    glowColor: '#00d4ff',
    glowIntensity: 30,
    charDelay: 0.05,
    animationType: 'wave',
    randomOffset: 50,
    microAnimation: true
  })
};
