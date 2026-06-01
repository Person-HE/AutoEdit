import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, animationUtils, palettes } from './templateUtils';

export const codeRainTemplate: TemplateDefinition = {
  id: 'bg_code_rain',
  name: '代码雨',
  description: '带有语法高亮色彩的代码雨效果',
  category: 'effect',
  schema: [
    { key: 'speed', label: '下落速度', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1 },
    { key: 'density', label: '密度', type: 'number', default: 25, min: 10, max: 50, step: 5 },
    { key: 'syntaxHighlight', label: '语法高亮', type: 'select', default: 'vscode', options: [{ label: 'VS Code', value: 'vscode' }, { label: 'Monokai', value: 'monokai' }, { label: 'Dracula', value: 'dracula' }] }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.5, 3);
    const density = paramGuard.number(params.density, 25, 10, 50);
    const syntaxHighlight = params.syntaxHighlight || 'vscode';
    const p = paramGuard.number(progress, 0, 0, 1);

    const syntaxColors: Record<string, string[]> = {
      vscode: ['#569cd6', '#ce9178', '#dcdcaa', '#4ec9b0', '#c586c0', '#9cdcfe'],
      monokai: ['#f92672', '#e6db74', '#a6e22e', '#66d9ef', '#ae81ff', '#fd971f'],
      dracula: ['#ff79c6', '#f1fa8c', '#50fa7b', '#bd93f9', '#ff5555', '#8be9fd']
    };
    const colors = syntaxColors[syntaxHighlight] || syntaxColors.vscode;

    const bgGrad = drawUtils.premiumGradient(ctx, -width / 2, -height / 2, width, height, ['#0a0a12', '#0f0f1a', '#0a0a12'], 180);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.vignette(ctx, width, height, 0.4);

    const codeTokens = [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
      'import', 'export', 'class', 'async', 'await', 'try', 'catch', 'new',
      '=>', '{}', '[]', '()', '===', '!==', '&&', '||', '...', 'true', 'false',
      'null', 'undefined', 'this', 'super', 'yield', 'typeof', 'instanceof'
    ];

    const fontSize = 12;
    const colSpacing = width / density;
    const trailLength = 15;

    ctx.save();
    ctx.font = `${fontSize}px 'Consolas', 'Courier New', monospace`;
    ctx.textAlign = 'center';

    for (let col = 0; col < density; col++) {
      const seed = col * 2137;
      const colX = -width / 2 + col * colSpacing + colSpacing / 2;
      const dropSpeed = (0.4 + ((seed * 7) % 100) / 100 * 0.6) * speed;
      const dropOffset = ((seed * 11) % 100) / 100;
      const dropPhase = (time * dropSpeed * 0.3 + dropOffset) % 1;
      const headY = -height / 2 + dropPhase * (height + trailLength * fontSize * 1.5);

      for (let row = 0; row < trailLength; row++) {
        const charY = headY - row * fontSize * 1.5;
        if (charY < -height / 2 - fontSize || charY > height / 2 + fontSize) continue;

        const fadeAlpha = 1 - row / trailLength;
        const tokenIndex = (seed * 3 + row * 5 + Math.floor(time * 2)) % codeTokens.length;
        const colorIndex = (seed + row) % colors.length;
        const token = codeTokens[tokenIndex];
        const tokenColor = colors[colorIndex];

        if (row === 0) {
          drawUtils.particle(ctx, colX, charY, fontSize * 2, tokenColor, 0.3, 0.4);
          drawUtils.radialGlow(ctx, colX, charY, fontSize * 2.5, tokenColor, 0.1);
          ctx.fillStyle = colorUtils.toRgba('#ffffff', 0.9);
          ctx.fillText(token, colX, charY);
        } else if (row < 3) {
          const brightColor = colorUtils.lerpColor(tokenColor, '#ffffff', (3 - row) / 3 * 0.4);
          ctx.fillStyle = colorUtils.toRgba(brightColor, fadeAlpha * 0.85);
          ctx.fillText(token, colX, charY);
        } else {
          ctx.fillStyle = colorUtils.toRgba(tokenColor, fadeAlpha * 0.5);
          ctx.fillText(token, colX, charY);
        }
      }
    }
    ctx.restore();

    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.008, time);
  },

  initParams: () => ({
    speed: 1,
    density: 25,
    syntaxHighlight: 'vscode'
  })
};
