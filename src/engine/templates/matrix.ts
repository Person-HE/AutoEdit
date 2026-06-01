import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const matrixTemplate: TemplateDefinition = {
  id: 'bg_matrix',
  name: '矩阵雨',
  description: 'Matrix风格数字雨，带有深度和发光效果',
  category: 'effect',
  schema: [
    { key: 'speed', label: '下落速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 },
    { key: 'density', label: '密度', type: 'number', default: 30, min: 10, max: 60, step: 5 },
    { key: 'glowColor', label: '发光颜色', type: 'color', default: '#00ff41' }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const density = paramGuard.number(params.density, 30, 10, 60);
    const glowColor = paramGuard.color(params.glowColor, '#00ff41');
    const p = paramGuard.number(progress, 0, 0, 1);

    const bgGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, ['#000a00', '#001200', '#000a00'], 180);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    drawUtils.vignette(ctx, width, height, 0.4);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    const fontSize = 14;
    const colSpacing = width / density;
    const trailLength = 20;

    ctx.save();
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';

    for (let col = 0; col < density; col++) {
      const seed = col * 1733;
      const colX = -width / 2 + col * colSpacing + colSpacing / 2;
      const dropSpeed = (0.5 + ((seed * 7) % 100) / 100 * 0.5) * speed;
      const dropOffset = ((seed * 11) % 100) / 100;
      const dropPhase = (time * dropSpeed * 0.5 + dropOffset) % 1;
      const headY = -height / 2 + dropPhase * (height + trailLength * fontSize);

      for (let row = 0; row < trailLength; row++) {
        const charY = headY - row * fontSize;
        if (charY < -height / 2 - fontSize || charY > height / 2 + fontSize) continue;

        const fadeAlpha = 1 - row / trailLength;
        const charIndex = (seed * 3 + row * 7 + Math.floor(time * 3)) % chars.length;
        const char = chars[charIndex];

        if (row === 0) {
          drawUtils.particle(ctx, colX, charY, fontSize * 1.5, glowColor, 0.4, 0.4);
          drawUtils.radialGlow(ctx, colX, charY, fontSize * 2, glowColor, 0.15);
          ctx.fillStyle = colorUtils.toRgba('#ffffff', 0.9);
          ctx.fillText(char, colX, charY);
        } else if (row < 3) {
          const brightColor = colorUtils.lerpColor(glowColor, '#ffffff', (3 - row) / 3 * 0.5);
          ctx.fillStyle = colorUtils.toRgba(brightColor, fadeAlpha * 0.9);
          ctx.fillText(char, colX, charY);
        } else {
          ctx.fillStyle = colorUtils.toRgba(glowColor, fadeAlpha * 0.6);
          ctx.fillText(char, colX, charY);
        }
      }
    }
    ctx.restore();

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.01, time);
  },

  initParams: () => ({
    speed: 1,
    density: 30,
    glowColor: '#00ff41'
  })
};
