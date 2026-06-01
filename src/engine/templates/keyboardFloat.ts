import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const keyboardFloatTemplate: TemplateDefinition = {
  id: 'ui_keyboard_float',
  name: '3D键盘',
  description: '带有3D透视和深度效果的浮动键盘动画',
  category: 'ui',
  schema: [
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#0a0a1a' },
    { key: 'keyColor', label: '按键颜色', type: 'color', default: '#1a1a2e' },
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#ffffff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00d4ff' },
    { key: 'keySize', label: '按键大小', type: 'number', default: 40, min: 20, max: 60, step: 5 },
    { key: 'floatSpeed', label: '浮动速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const availSize = adaptiveLayout.getAvailableSize(width, height, 0.95);
    const bgColor = paramGuard.color(params.bgColor, '#0a0a1a');
    const keyColor = paramGuard.color(params.keyColor, '#1a1a2e');
    const textColor = paramGuard.color(params.textColor, '#ffffff');
    const accentColor = paramGuard.color(params.accentColor, '#00d4ff');
    const keySize = paramGuard.number(params.keySize, 40, 20, 60);
    const floatSpeed = paramGuard.number(params.floatSpeed, 1, 0.5, 3);
    const p = paramGuard.number(progress, 0, 0, 1);

    const enterProgress = Math.min(1, p / 0.4);
    const enterSpring = easing.spring(enterProgress, 100, 14, 1);
    const exitProgress = p > 0.7 ? (p - 0.7) / 0.3 : 0;
    const exitEased = easing.easeInCubic(exitProgress);

    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.cyberpunk, time * 0.1, 0.2);
    drawUtils.vignette(ctx, width, height, 0.5);

    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    const gap = keySize * 0.15;
    const totalWidth = 10 * (keySize + gap) - gap;
    const totalHeight = rows.length * (keySize + gap) - gap;
    const startY = -totalHeight / 2;

    const tiltAngle = 25 * Math.PI / 180;
    const perspectiveScale = 0.85;

    ctx.save();
    const floatOsc = easing.dampedOscillation(time * floatSpeed * 0.5, 0.8, 0.05);
    ctx.translate(0, floatOsc * 10 * enterSpring * (1 - exitEased));
    ctx.scale(enterSpring * (1 - exitEased * 0.2), enterSpring * (1 - exitEased * 0.2) * perspectiveScale);

    ctx.save();
    ctx.fillStyle = colorUtils.toRgba('#000000', 0.3);
    ctx.filter = 'blur(25px)';
    const kbPad = keySize * 0.5;
    drawUtils.roundedRect(ctx, -totalWidth / 2 - kbPad + 8, startY - kbPad + 8, totalWidth + kbPad * 2, totalHeight + kbPad * 2, 20);
    ctx.fill();
    ctx.restore();

    const kbGrad = drawUtils.premiumGradient(ctx, -totalWidth / 2 - kbPad, startY - kbPad, totalWidth + kbPad * 2, totalHeight + kbPad * 2, [colorUtils.adjustBrightness(bgColor, 15), bgColor, colorUtils.adjustBrightness(bgColor, -10)], 180);
    drawUtils.roundedRect(ctx, -totalWidth / 2 - kbPad, startY - kbPad, totalWidth + kbPad * 2, totalHeight + kbPad * 2, 20);
    ctx.fillStyle = kbGrad;
    ctx.fill();

    drawUtils.glassBackground(ctx, -totalWidth / 2 - kbPad, startY - kbPad, totalWidth + kbPad * 2, totalHeight + kbPad * 2, 20, 0.06, colorUtils.toRgba(accentColor, 0.05));
    drawUtils.specularHighlight(ctx, -totalWidth / 2 - kbPad + 4, startY - kbPad + 4, totalWidth + kbPad * 2 - 8, totalHeight + kbPad * 2, 18, 0.15);

    const beamProgress = (time * 0.25) % 1;
    drawUtils.borderBeam(ctx, -totalWidth / 2 - kbPad, startY - kbPad, totalWidth + kbPad * 2, totalHeight + kbPad * 2, 20, beamProgress, accentColor, colorUtils.lerpColor(accentColor, '#ff00e5', 0.5), 60);

    const activeKeyIndex = Math.floor(time * 3) % 30;
    let keyCounter = 0;

    for (let row = 0; row < rows.length; row++) {
      const rowKeys = rows[row];
      const rowWidth = rowKeys.length * (keySize + gap) - gap;
      const rowOffset = (totalWidth - rowWidth) / 2;
      const rowY = startY + row * (keySize + gap);

      for (let col = 0; col < rowKeys.length; col++) {
        const keyX = -totalWidth / 2 + rowOffset + col * (keySize + gap);
        const keyY = rowY;
        const isActive = keyCounter === activeKeyIndex;
        keyCounter++;

        const keyFloatDelay = (row * 0.1 + col * 0.02);
        const keyEnterProgress = Math.max(0, Math.min(1, (p - keyFloatDelay) / 0.3));
        const keyEnterSpring = easing.spring(keyEnterProgress, 100, 14, 1);

        const keyPressDepth = isActive ? easing.dampedOscillation(time * 6, 1.5, 0.3) * 4 : 0;

        ctx.save();
        ctx.translate(0, -keyPressDepth);
        ctx.globalAlpha = keyEnterSpring * (1 - exitEased);

        ctx.save();
        ctx.fillStyle = colorUtils.toRgba('#000000', 0.3);
        ctx.filter = 'blur(4px)';
        drawUtils.roundedRect(ctx, keyX + 2, keyY + 3, keySize, keySize, keySize * 0.15);
        ctx.fill();
        ctx.restore();

        if (isActive) {
          drawUtils.multiLayerGlow(ctx, keyX + keySize / 2, keyY + keySize / 2, accentColor, keySize * 0.6, 4);
        }

        const keyGrad = drawUtils.premiumGradient(ctx, keyX, keyY, keySize, keySize, [colorUtils.adjustBrightness(keyColor, isActive ? 35 : 20), keyColor, colorUtils.adjustBrightness(keyColor, isActive ? -10 : -20), colorUtils.lerpColor(keyColor, accentColor, isActive ? 0.2 : 0.05)], 135);
        drawUtils.roundedRect(ctx, keyX, keyY, keySize, keySize, keySize * 0.15);
        ctx.fillStyle = keyGrad;
        ctx.fill();

        if (isActive) {
          drawUtils.glassBackground(ctx, keyX, keyY, keySize, keySize, keySize * 0.15, 0.1, colorUtils.toRgba(accentColor, 0.15));
          drawUtils.specularHighlight(ctx, keyX + 2, keyY + 2, keySize - 4, keySize, keySize * 0.12, 0.25);
        } else {
          drawUtils.specularHighlight(ctx, keyX + 1, keyY + 1, keySize - 2, keySize * 0.5, keySize * 0.1, 0.12);
        }

        drawUtils.roundedRect(ctx, keyX, keyY, keySize, keySize, keySize * 0.15);
        ctx.strokeStyle = colorUtils.toRgba(accentColor, isActive ? 0.4 : 0.1);
        ctx.lineWidth = isActive ? 1.5 : 0.5;
        ctx.stroke();

        const labelFontSize = keySize * 0.4;
        ctx.save();
        ctx.font = `bold ${labelFontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (isActive) {
          drawUtils.gradientText(ctx, rowKeys[col], keyX + keySize / 2, keyY + keySize / 2, [accentColor, '#ffffff'], 90);
        } else {
          ctx.fillStyle = colorUtils.toRgba(textColor, 0.6);
          ctx.fillText(rowKeys[col], keyX + keySize / 2, keyY + keySize / 2);
        }
        ctx.restore();

        ctx.restore();
      }
    }

    ctx.save();
    drawUtils.roundedRect(ctx, -totalWidth / 2 - kbPad, startY - kbPad, totalWidth + kbPad * 2, totalHeight + kbPad * 2, 20);
    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.2);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  },

  initParams: () => ({
    bgColor: '#0a0a1a',
    keyColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    keySize: 40,
    floatSpeed: 1
  })
};
