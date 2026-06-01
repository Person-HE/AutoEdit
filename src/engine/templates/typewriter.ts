import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, animationUtils, palettes, colorUtils } from './templateUtils';

export const typewriterTemplate: TemplateDefinition = {
  id: 'text_typewriter',
  name: '打字机效果',
  description: '模拟打字机逐字输入的动画效果，带光标闪烁',
  category: 'text',
  schema: [
    {
      key: 'text',
      label: '文字内容',
      type: 'textarea',
      default: 'Hello World\nWelcome to the future of video editing.',
      placeholder: '输入要显示的文字'
    },
    {
      key: 'textColor',
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
      key: 'glowIntensity',
      label: '发光强度',
      type: 'number',
      default: 20,
      min: 0,
      max: 100,
      step: 5
    },
    {
      key: 'cursorColor',
      label: '光标颜色',
      type: 'color',
      default: '#00ff88'
    },
    {
      key: 'cursorWidth',
      label: '光标宽度',
      type: 'number',
      default: 3,
      min: 1,
      max: 10,
      step: 1
    },
    {
      key: 'cursorBlinkSpeed',
      label: '光标闪烁速度',
      type: 'number',
      default: 2,
      min: 0.5,
      max: 5,
      step: 0.5
    },
    {
      key: 'typingSpeed',
      label: '打字速度',
      type: 'number',
      default: 1,
      min: 0.2,
      max: 3,
      step: 0.1
    },
    {
      key: 'showSoundWave',
      label: '显示声波效果',
      type: 'boolean',
      default: true
    },
    {
      key: 'soundWaveColor',
      label: '声波颜色',
      type: 'color',
      default: '#00ff88'
    },
    {
      key: 'backgroundColor',
      label: '背景颜色',
      type: 'color',
      default: '#0a0a0a'
    },
    {
      key: 'showScanline',
      label: '显示扫描线',
      type: 'boolean',
      default: true
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;

    const text = paramGuard.string(params.text, 'Hello World\nWelcome to the future of video editing.');
    const textColor = paramGuard.color(params.textColor, '#00ff88');
    const glowColor = paramGuard.color(params.glowColor, '#00ff88');
    const glowIntensity = paramGuard.number(params.glowIntensity, 20, 0, 100);
    const cursorColor = paramGuard.color(params.cursorColor, '#00ff88');
    const cursorWidth = paramGuard.number(params.cursorWidth, 3, 1, 10);
    const cursorBlinkSpeed = paramGuard.number(params.cursorBlinkSpeed, 2, 0.5, 5);
    const typingSpeed = paramGuard.number(params.typingSpeed, 1, 0.2, 3);
    const showSoundWave = paramGuard.boolean(params.showSoundWave, true);
    const soundWaveColor = paramGuard.color(params.soundWaveColor, '#00ff88');
    const backgroundColor = paramGuard.color(params.backgroundColor, '#0a0a0a');
    const showScanline = paramGuard.boolean(params.showScanline, true);

    const p = paramGuard.number(progress, 0, 0, 1);

    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);

    ctx.save();
    ctx.fillStyle = '#050510';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.cyberpunk.slice(1, 5), time * 0.2, 0.15);

    if (showScanline) {
      const scanlineCount = Math.floor(height / 4);
      for (let i = 0; i < scanlineCount; i++) {
        const y = -height / 2 + i * 4;
        const scanAlpha = 0.015 + easing.perlinNoise1D(i * 0.1 + time * 0.5, 1, i) * 0.01;
        ctx.fillStyle = colorUtils.withAlpha(0, 255, 136, scanAlpha);
        ctx.fillRect(-width / 2, y, width, 1);
      }
    }

    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.015, time);
    ctx.restore();

    const lines = text.split('\n');

    const fontSize = adaptiveLayout.calculateFontSize(
      ctx,
      text.replace(/\n/g, ''),
      availSize.width * 0.9,
      availSize.height * 0.8,
      lines.length
    );

    const lineHeight = fontSize * 1.5;

    const totalChars = text.length;

    const noiseBasedProgress = p * typingSpeed;
    let charAccum = 0;
    for (let i = 0; i < totalChars; i++) {
      const charNoise = easing.perlinNoise1D(i * 0.15, 2.5, i * 3.7);
      const speedMod = 0.7 + charNoise * 0.6;
      charAccum += speedMod;
    }
    const normalizedProgress = noiseBasedProgress * charAccum / totalChars;

    let runningSum = 0;
    let targetCharIndex = 0;
    for (let i = 0; i < totalChars; i++) {
      const charNoise = easing.perlinNoise1D(i * 0.15, 2.5, i * 3.7);
      const speedMod = 0.7 + charNoise * 0.6;
      runningSum += speedMod;
      if (runningSum / charAccum >= normalizedProgress) {
        targetCharIndex = i;
        break;
      }
      targetCharIndex = i + 1;
    }
    targetCharIndex = Math.min(targetCharIndex, totalChars);

    const currentCharProgress = (noiseBasedProgress * totalChars) % 1;

    let charCount = 0;
    let cursorX = 0;
    let cursorY = 0;

    const textGradColors = [palettes.cyberpunk[3], palettes.cyberpunk[4], palettes.cyberpunk[5]];

    lines.forEach((line, lineIndex) => {
      const lineY = -(lines.length * lineHeight) / 2 + lineIndex * lineHeight + lineHeight / 2;

      if (charCount + line.length < targetCharIndex) {
        ctx.save();
        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        drawUtils.neonText(ctx, line, -availSize.width * 0.45, lineY, glowColor, glowIntensity / 30);

        ctx.restore();

        charCount += line.length + 1;
        cursorX = -availSize.width * 0.45 + ctx.measureText(line).width;
        cursorY = lineY;
      }
      else if (charCount <= targetCharIndex) {
        const charsToShow = targetCharIndex - charCount;
        const visibleText = line.substring(0, charsToShow);

        ctx.save();
        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        drawUtils.neonText(ctx, visibleText, -availSize.width * 0.45, lineY, glowColor, glowIntensity / 30);

        ctx.restore();

        cursorX = -availSize.width * 0.45 + ctx.measureText(visibleText).width;
        cursorY = lineY;

        if (showSoundWave && currentCharProgress > 0 && charsToShow > 0 && charsToShow <= line.length) {
          const waveDecay = easing.inertiaDecay(currentCharProgress, 4, 3);
          const waveIntensity = waveDecay * fontSize * 0.4;

          ctx.save();
          const waveRgb = colorUtils.hexToRgb(soundWaveColor);
          for (let ring = 0; ring < 3; ring++) {
            const ringRadius = fontSize * 0.5 + waveIntensity * (0.6 + ring * 0.3);
            const ringAlpha = (1 - currentCharProgress) * (0.3 - ring * 0.08);
            ctx.strokeStyle = colorUtils.withAlpha(waveRgb.r, waveRgb.g, waveRgb.b, ringAlpha);
            ctx.lineWidth = 2 - ring * 0.5;
            ctx.beginPath();
            for (let i = 0; i <= 24; i++) {
              const angle = (i / 24) * Math.PI * 2;
              const noiseR = easing.perlinNoise1D(angle * 0.5 + time * 3, 2, i * 1.3);
              const radius = ringRadius * (0.8 + noiseR * 0.4);
              const x = cursorX + Math.cos(angle) * radius;
              const y = lineY + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }
          ctx.restore();
        }

        charCount += line.length + 1;
      }
    });

    const cursorBlink = Math.sin(time * cursorBlinkSpeed * Math.PI) > 0;
    if (cursorBlink || p >= 1) {
      ctx.save();
      drawUtils.multiLayerGlow(ctx, cursorX + 2 + cursorWidth / 2, cursorY, cursorColor, fontSize * 0.6, 4);

      const cursorWobble = easing.dampedOscillation(time * 2, 8, 0.1) * 0.5;
      const cursorGrad = ctx.createLinearGradient(cursorX + 2, cursorY - fontSize * 0.4, cursorX + 2, cursorY + fontSize * 0.4);
      cursorGrad.addColorStop(0, colorUtils.toRgba(cursorColor, 0.3));
      cursorGrad.addColorStop(0.5, cursorColor);
      cursorGrad.addColorStop(1, colorUtils.toRgba(cursorColor, 0.3));
      ctx.fillStyle = cursorGrad;
      ctx.fillRect(cursorX + 2, cursorY - fontSize * 0.4 + cursorWobble, cursorWidth, fontSize * 0.8);
      ctx.restore();
    }

    ctx.save();
    const barY = height / 2 - height * 0.03;
    const barWidth = availSize.width * 0.9;
    const barX = -barWidth / 2;

    drawUtils.glassBackground(ctx, barX, barY - 2, barWidth, height * 0.008, 4, 0.08, colorUtils.toRgba(glowColor, 0.15));

    const progressEased = easing.snapSpring(p, 250, 28);
    const activeBarWidth = barWidth * progressEased;
    if (activeBarWidth > 0) {
      const progressGrad = drawUtils.premiumGradient(ctx, barX, barY - 2, activeBarWidth, height * 0.008, textGradColors, 90);
      ctx.fillStyle = progressGrad;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      drawUtils.roundedRect(ctx, barX, barY - 2, activeBarWidth, height * 0.008, 4);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    const cornerSize = Math.min(width, height) * 0.05;
    ctx.strokeStyle = colorUtils.toRgba(glowColor, 0.4);
    ctx.lineWidth = 1.5;

    drawUtils.lightBeam(ctx, -width / 2 + 20, -height / 2 + 20, -width / 2 + 20 + cornerSize, -height / 2 + 20, glowColor, 1, 0.3, 6);
    drawUtils.lightBeam(ctx, -width / 2 + 20, -height / 2 + 20, -width / 2 + 20, -height / 2 + 20 + cornerSize, glowColor, 1, 0.3, 6);

    drawUtils.lightBeam(ctx, width / 2 - 20, height / 2 - 20, width / 2 - 20 - cornerSize, height / 2 - 20, glowColor, 1, 0.3, 6);
    drawUtils.lightBeam(ctx, width / 2 - 20, height / 2 - 20, width / 2 - 20, height / 2 - 20 - cornerSize, glowColor, 1, 0.3, 6);

    ctx.restore();
  },

  initParams: (duration: number) => ({
    text: 'Hello World\nWelcome to the future of video editing.',
    textColor: '#00ff88',
    glowColor: '#00ff88',
    glowIntensity: 20,
    cursorColor: '#00ff88',
    cursorWidth: 3,
    cursorBlinkSpeed: 2,
    typingSpeed: 1,
    showSoundWave: true,
    soundWaveColor: '#00ff88',
    backgroundColor: '#0a0a0a',
    showScanline: true
  })
};
