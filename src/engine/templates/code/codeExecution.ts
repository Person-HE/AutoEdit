import { TemplateDefinition, TemplateRenderContext } from '../types';
import { paramGuard, drawUtils, easing } from '../templateUtils';

export const codeExecutionTemplate: TemplateDefinition = {
  id: 'code_execution',
  name: '代码执行',
  description: '代码编辑器风格，带语法高亮、光标与执行进度条',
  category: 'code',
  quality: 'viral',
  mood: ['mysterious', 'calm'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring'],
  schema: [
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00ff9d' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const accentColor = paramGuard.color(params.accentColor, '#00ff9d');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const lines = [
      { text: 'function ', color: '#ff7b72', key: true },
      { text: 'leverageAI', color: '#79c0ff', key: true },
      { text: '() {', color: '#ffffff', key: true },
      { text: '  const income = ', color: '#ffffff', key: true },
      { text: 'optimize(stream)', color: '#d2a8ff', key: true },
      { text: ';', color: '#ffffff', key: true },
      { text: '  return income.scale(', color: '#ffffff', key: true },
      { text: '10', color: '#79c0ff', key: true },
      { text: ');', color: '#ffffff', key: true },
      { text: '}', color: '#ffffff', key: true },
      { text: '// Execute...', color: '#8b949e', key: true },
    ];

    ctx.save();
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const lineHeight = 40;
    const startY = -height / 2 + 100;
    const totalChars = lines.reduce((sum, l) => sum + l.text.length, 0);
    const typed = Math.floor(totalChars * easing.easeOutExpo(p));

    let charCount = 0;
    lines.forEach((line, i) => {
      let x = -width / 2 + 80;
      const y = startY + i * lineHeight;
      for (const ch of line.text) {
        if (charCount > typed) return;
        ctx.fillStyle = line.color;
        ctx.globalAlpha = p;
        ctx.fillText(ch, x, y);
        x += ctx.measureText(ch).width;
        charCount++;
      }
    });

    // 光标
    if (p < 1 && Math.floor(time * 12) % 2 === 0) {
      ctx.fillStyle = accentColor;
      ctx.fillRect(-width / 2 + 80 + ctx.measureText(lines.map(l => l.text).join('').slice(0, typed)).width, startY + (lines.length - 1) * lineHeight - 14, 3, 28);
    }

    ctx.restore();

    // 进度条
    const barW = width * 0.6;
    const barH = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-barW / 2, height / 2 - 80, barW, barH);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-barW / 2, height / 2 - 80, barW * p, barH);

    drawUtils.scanlines(ctx, width, height, 4, 0.06);
  },
  initParams: () => ({
    accentColor: '#00ff9d',
  }),
};
