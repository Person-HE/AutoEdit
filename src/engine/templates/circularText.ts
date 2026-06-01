import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

export const circularTextTemplate: TemplateDefinition = {
  id: 'text_circular',
  name: '圆形文字',
  description: '文字沿环形排列旋转动画效果',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'string',
      default: 'CIRCULAR TEXT ANIMATION',
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
      default: 25,
      min: 0,
      max: 100,
      step: 5
    },
    {
      key: 'radiusRatio',
      label: '圆环半径比例',
      type: 'number',
      default: 0.35,
      min: 0.1,
      max: 0.5,
      step: 0.05
    },
    {
      key: 'rotationSpeed',
      label: '旋转速度',
      type: 'number',
      default: 1,
      min: -3,
      max: 3,
      step: 0.1
    },
    {
      key: 'animationType',
      label: '动画类型',
      type: 'select',
      default: 'spiral',
      options: [
        { label: '螺旋入场', value: 'spiral' },
        { label: '逐字出现', value: 'sequential' },
        { label: '缩放旋转', value: 'zoom' },
        { label: '波浪扩散', value: 'wave' }
      ]
    },
    {
      key: 'centerText',
      label: '中心文字',
      type: 'string',
      default: '★',
      placeholder: '中心显示的文字或符号'
    },
    {
      key: 'centerTextColor',
      label: '中心文字颜色',
      type: 'color',
      default: '#ff79c6'
    },
    {
      key: 'centerGlowIntensity',
      label: '中心发光强度',
      type: 'number',
      default: 40,
      min: 0,
      max: 100,
      step: 5
    },
    {
      key: 'showOrbit',
      label: '显示轨道',
      type: 'boolean',
      default: true
    },
    {
      key: 'orbitColor',
      label: '轨道颜色',
      type: 'color',
      default: '#333333'
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const text = paramGuard.string(params.text, 'CIRCULAR TEXT ANIMATION');
    const textColor = paramGuard.color(params.textColor, '#00d4ff');
    const glowColor = paramGuard.color(params.glowColor, '#00d4ff');
    const glowIntensity = paramGuard.number(params.glowIntensity, 25, 0, 100);
    const radiusRatio = paramGuard.number(params.radiusRatio, 0.35, 0.1, 0.5);
    const rotationSpeed = paramGuard.number(params.rotationSpeed, 1, -3, 3);
    const animationType = paramGuard.string(params.animationType, 'spiral');
    const centerText = paramGuard.string(params.centerText, '★');
    const centerTextColor = paramGuard.color(params.centerTextColor, '#ff79c6');
    const centerGlowIntensity = paramGuard.number(params.centerGlowIntensity, 40, 0, 100);
    const showOrbit = paramGuard.boolean(params.showOrbit, true);
    const orbitColor = paramGuard.color(params.orbitColor, '#333333');

    const p = paramGuard.number(progress, 0, 0, 1);

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const minDimension = Math.min(availSize.width, availSize.height);

    ctx.save();
    ctx.fillStyle = '#060610';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, [palettes.royal[2], palettes.royal[4], palettes.aurora[0]], time * 0.25, 0.2);
    drawUtils.vignette(ctx, width, height, 0.55);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.02, time);
    ctx.restore();

    const radius = minDimension * radiusRatio;

    const fontSize = Math.min(minDimension * 0.08, radius * 0.25);

    const processedText = text.trim();
    const chars = processedText.split('');

    const anglePerChar = (Math.PI * 2) / chars.length;

    let animationProgress = p;
    let baseRotation = 0;

    switch (animationType) {
      case 'spiral':
        animationProgress = easing.snapSpring(p, 250, 28);
        baseRotation = animationProgress * Math.PI * 4 + time * rotationSpeed;
        break;
      case 'sequential':
        baseRotation = time * rotationSpeed;
        break;
      case 'zoom':
        animationProgress = easing.spring(p, 120, 10, 1);
        baseRotation = animationProgress * Math.PI * 2 + time * rotationSpeed;
        break;
      case 'wave':
        animationProgress = easing.spring(p, 150, 14, 1);
        baseRotation = time * rotationSpeed;
        break;
    }

    if (showOrbit) {
      ctx.save();
      const orbitRgb = colorUtils.hexToRgb(glowColor);
      ctx.strokeStyle = colorUtils.withAlpha(orbitRgb.r, orbitRgb.g, orbitRgb.b, 0.08 + animationProgress * 0.12);
      ctx.lineWidth = 2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = colorUtils.withAlpha(orbitRgb.r, orbitRgb.g, orbitRgb.b, 0.05);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = colorUtils.withAlpha(orbitRgb.r, orbitRgb.g, orbitRgb.b, 0.03);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const pal = palettes.aurora;

    chars.forEach((char, index) => {
      let charProgress = 1;

      if (animationType === 'sequential') {
        const charDelay = index * 0.03;
        const charAnimDuration = 0.3;
        if (p < charDelay) {
          charProgress = 0;
        } else if (p < charDelay + charAnimDuration) {
          charProgress = easing.spring((p - charDelay) / charAnimDuration, 180, 14, 1);
        }
      } else if (animationType === 'wave') {
        const waveOffset = index / chars.length;
        const waveProgress = (p * 2 - waveOffset);
        if (waveProgress > 0 && waveProgress < 1) {
          charProgress = easing.snapSpring(waveProgress, 280, 26);
        } else if (waveProgress >= 1) {
          charProgress = 1;
        } else {
          charProgress = 0;
        }
      } else {
        charProgress = animationProgress;
      }

      if (charProgress <= 0) return;

      const angle = baseRotation + index * anglePerChar - Math.PI / 2;

      let charRadius = radius;

      let scale = 1;
      let alpha = charProgress;
      let offsetX = 0;
      let offsetY = 0;

      switch (animationType) {
        case 'spiral':
          charRadius = radius * (0.5 + charProgress * 0.5);
          scale = charProgress;
          break;
        case 'zoom':
          scale = charProgress;
          break;
        case 'wave':
          const waveY = easing.dampedOscillation(angle * 0.5 + time * 2, 3, 0.2) * fontSize * 0.2 * charProgress;
          offsetY = waveY;
          break;
      }

      const x = Math.cos(angle) * charRadius + offsetX;
      const y = Math.sin(angle) * charRadius + offsetY;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.scale(scale, scale);

      if (alpha > 0) {
        const colorT = index / Math.max(1, chars.length - 1);
        const charGradColors = [
          colorUtils.lerpColor(pal[0], pal[1], colorT),
          colorUtils.lerpColor(pal[1], pal[2], colorT),
          colorUtils.lerpColor(pal[2], pal[3], colorT),
        ];

        ctx.save();
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = alpha;

        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity * alpha * 0.5;
        drawUtils.gradientText(ctx, char, 0, 0, charGradColors, 135 + index * 20);

        ctx.restore();
      }

      ctx.restore();
    });

    if (centerText) {
      const centerProgress = easing.spring(Math.min(1, p * 2), 140, 12, 1);
      const centerFontSize = fontSize * 2 * centerProgress;
      const centerPulse = 1 + easing.dampedOscillation(time * 0.8, 2, 0.15) * 0.08;

      ctx.save();
      ctx.scale(centerPulse, centerPulse);

      drawUtils.multiLayerGlow(ctx, 0, 0, centerTextColor, centerFontSize * 1.5, 5);

      ctx.save();
      ctx.font = `bold ${centerFontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const centerGradColors = [centerTextColor, colorUtils.lerpColor(centerTextColor, '#ffffff', 0.4), centerTextColor];
      drawUtils.gradientText(ctx, centerText, 0, 0, centerGradColors, 180);

      ctx.restore();
      ctx.restore();
    }

    if (animationProgress > 0.5) {
      const dotCount = 8;
      const dotRadius = radius * 1.15;
      const dotProgress = (animationProgress - 0.5) * 2;

      for (let i = 0; i < dotCount; i++) {
        const dotAngle = (time * 0.5 + i / dotCount) * Math.PI * 2;
        const dotX = Math.cos(dotAngle) * dotRadius;
        const dotY = Math.sin(dotAngle) * dotRadius;
        const dotSize = 5 + easing.perlinNoise1D(time * 1.5 + i * 0.7, 1, i * 3) * 3;
        const dotAlpha = dotProgress * (0.4 + easing.perlinNoise1D(time * 1.2 + i * 0.5, 1, i * 5) * 0.3);

        const dotColor = pal[i % pal.length];
        drawUtils.particle(ctx, dotX, dotY, dotSize, dotColor, dotAlpha, 0.6);
      }
    }

    ctx.save();
    const borderP = (time * 0.3) % 1;
    drawUtils.borderBeam(ctx, -minDimension * 0.45, -minDimension * 0.45, minDimension * 0.9, minDimension * 0.9, 20, borderP, palettes.aurora[0], palettes.aurora[2], 40);
    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'CIRCULAR TEXT ANIMATION',
    textColor: '#00d4ff',
    glowColor: '#00d4ff',
    glowIntensity: 25,
    radiusRatio: 0.35,
    rotationSpeed: 1,
    animationType: 'spiral',
    centerText: '★',
    centerTextColor: '#ff79c6',
    centerGlowIntensity: 40,
    showOrbit: true,
    orbitColor: '#333333'
  })
};
