import { TemplateDefinition, TemplateRenderContext } from './types';
import { easing, adaptiveLayout, paramGuard, drawUtils, colorUtils, palettes, animationUtils } from './templateUtils';

const syntaxColors: Record<string, string> = {
  keyword: '#ff79c6',
  string: '#f1fa8c',
  comment: '#6272a4',
  number: '#bd93f9',
  function: '#50fa7b',
  variable: '#f8f8f2',
  operator: '#ff79c6',
  default: '#f8f8f2'
};

const highlightCode = (line: string): { text: string; color: string }[] => {
  const tokens: { text: string; color: string }[] = [];
  const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'from', 'export', 'default', 'async', 'await', 'new', 'this', 'true', 'false', 'null', 'undefined'];

  const regex = /(".*?"|'.*?'|`.*?`|\b\d+\b|\b\w+\b|[{}()\[\];,=+\-*/<>!&|])/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.substring(lastIndex, match.index), color: syntaxColors.default });
    }

    const token = match[0];
    let color = syntaxColors.default;

    if (keywords.includes(token)) {
      color = syntaxColors.keyword;
    } else if (/^["'`]/.test(token)) {
      color = syntaxColors.string;
    } else if (/^\d/.test(token)) {
      color = syntaxColors.number;
    } else if (/^[{}()\[\];,=+\-*/<>!&|]/.test(token)) {
      color = syntaxColors.operator;
    }

    tokens.push({ text: token, color });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ text: line.substring(lastIndex), color: syntaxColors.default });
  }

  return tokens;
};

const parseExecutionSequence = (sequence: string): number[] => {
  if (!sequence.trim()) return [];
  return sequence.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0);
};

const drawBubble = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  params: {
    bubbleColor: string;
    bubbleTextColor: string;
    fontSize: number;
  }
) => {
  const { bubbleColor, bubbleTextColor, fontSize } = params;

  ctx.font = `${fontSize}px Arial, sans-serif`;
  const padding = 10;
  const textWidth = ctx.measureText(text).width;
  const bubbleWidth = textWidth + padding * 2;
  const bubbleHeight = fontSize + padding * 2;

  ctx.save();
  drawUtils.glassBackground(ctx, x, y - bubbleHeight - 10, bubbleWidth, bubbleHeight, 8, 0.2, colorUtils.toRgba(bubbleColor, 0.3));
  ctx.restore();

  ctx.save();
  ctx.fillStyle = bubbleColor;
  ctx.beginPath();
  ctx.moveTo(x + 15, y - 10);
  ctx.lineTo(x + 25, y - 10);
  ctx.lineTo(x + 20, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = bubbleTextColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = bubbleColor;
  ctx.shadowBlur = 6;
  ctx.fillText(text, x + padding, y - bubbleHeight / 2 - 10);
  ctx.restore();
};

export const codeExecutionTemplate: TemplateDefinition = {
  id: 'code_execution',
  name: '代码执行流高亮',
  description: '代码逐行执行高亮效果，支持变量值气泡提示',
  category: 'code',
  schema: [
    {
      key: 'code',
      label: '代码内容',
      type: 'code',
      default: `const sum = (a, b) => {
  const result = a + b;
  return result;
};

const x = 5;
const y = 10;
const total = sum(x, y);
console.log(total);`,
      placeholder: '输入要展示的代码'
    },
    {
      key: 'executionSequence',
      label: '执行行序列',
      type: 'string',
      default: '1,3,4,5,6,7',
      placeholder: '如: 1,3,4,5 表示依次执行第1、3、4、5行'
    },
    {
      key: 'variableBubbles',
      label: '变量气泡',
      type: 'textarea',
      default: '3:result=15\n7:total=15',
      placeholder: '格式: 行号:变量名=值\n如: 3:result=15'
    },
    {
      key: 'highlightColor',
      label: '高亮颜色',
      type: 'color',
      default: '#ffff00'
    },
    {
      key: 'highlightOpacity',
      label: '高亮透明度',
      type: 'number',
      default: 0.3,
      min: 0,
      max: 1,
      step: 0.05
    },
    {
      key: 'fontScale',
      label: '字体缩放比例(%)',
      type: 'number',
      default: 95,
      min: 50,
      max: 120,
      step: 5
    },
    {
      key: 'lineNumberColor',
      label: '行号颜色',
      type: 'color',
      default: '#6272a4'
    },
    {
      key: 'bubbleColor',
      label: '气泡颜色',
      type: 'color',
      default: '#ff79c6'
    },
    {
      key: 'bubbleTextColor',
      label: '气泡文字颜色',
      type: 'color',
      default: '#ffffff'
    },
    {
      key: 'showArrow',
      label: '显示箭头',
      type: 'boolean',
      default: true
    },
    {
      key: 'arrowColor',
      label: '箭头颜色',
      type: 'color',
      default: '#ff79c6'
    },
    {
      key: 'codePaddingRatio',
      label: '代码边距比例(%)',
      type: 'number',
      default: 2,
      min: 0,
      max: 10,
      step: 1
    }
  ],

  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const {
      code,
      executionSequence,
      variableBubbles,
      highlightColor,
      highlightOpacity,
      fontScale,
      lineNumberColor,
      bubbleColor,
      bubbleTextColor,
      showArrow,
      arrowColor,
      codePaddingRatio
    } = params;

    const lines = code.split('\n');
    if (lines.length === 0) return;

    const execSequence = parseExecutionSequence(executionSequence);
    if (execSequence.length === 0) return;

    const bubbles: Record<number, string> = {};
    variableBubbles.split('\n').forEach(line => {
      const match = line.match(/(\d+):(.+)/);
      if (match) {
        bubbles[parseInt(match[1]) - 1] = match[2].trim();
      }
    });

    ctx.save();
    ctx.fillStyle = '#0c0c1e';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    drawUtils.meshGradient(ctx, -width / 2, -height / 2, width, height, palettes.royal.slice(1, 4), time * 0.15, 0.12);
    drawUtils.vignette(ctx, width, height, 0.4);
    drawUtils.noiseTexture(ctx, 0, 0, width, height, 0.015, time);
    ctx.restore();

    const targetScale = fontScale / 100;
    const availableWidth = width * targetScale;
    const availableHeight = height * targetScale;

    const codePadding = Math.min(width, height) * (codePaddingRatio / 100);
    const lineNumberWidth = availableWidth * 0.08;
    const contentWidth = availableWidth - lineNumberWidth - codePadding * 2;

    let maxLineWidth = 0;
    lines.forEach(line => {
      let lineWidth = 0;
      lineWidth = line.length * 10;
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
    });

    const fontSizeByWidth = (contentWidth / maxLineWidth) * 8;
    const fontSizeByHeight = availableHeight / lines.length * 0.85;
    const fontSize = Math.min(fontSizeByWidth, fontSizeByHeight, height * 0.05);
    const lineHeight = fontSize * 1.3;

    const stepDuration = 1 / execSequence.length;
    const currentStep = Math.min(Math.floor(progress / stepDuration), execSequence.length - 1);
    const stepProgress = (progress % stepDuration) / stepDuration;

    const currentLineIndex = execSequence[currentStep];
    const prevLineIndex = currentStep > 0 ? execSequence[currentStep - 1] : -1;

    const contentX = -availableWidth / 2 + lineNumberWidth;
    const startY = -(lines.length * lineHeight) / 2;

    const codeBlockX = contentX - codePadding;
    const codeBlockY = startY - codePadding;
    const codeBlockW = availableWidth - lineNumberWidth + codePadding * 2;
    const codeBlockH = lines.length * lineHeight + codePadding * 2;

    ctx.save();
    drawUtils.glassBackground(ctx, codeBlockX, codeBlockY, codeBlockW, codeBlockH, 12, 0.06, colorUtils.withAlpha(255, 255, 255, 0.08));
    ctx.restore();

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;

      ctx.save();
      const lnRgb = colorUtils.hexToRgb(lineNumberColor);
      ctx.fillStyle = colorUtils.withAlpha(lnRgb.r, lnRgb.g, lnRgb.b, 0.6);
      ctx.font = `${fontSize}px 'Courier New', monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), contentX - fontSize * 0.5, y + lineHeight / 2);
      ctx.restore();

      if (index === currentLineIndex) {
        const highlightSpring = easing.snapSpring(Math.min(1, stepProgress * 3), 280, 26);

        ctx.save();
        const hlRgb = colorUtils.hexToRgb(highlightColor);
        const hlGrad = ctx.createLinearGradient(contentX - fontSize * 0.3, y, contentX - fontSize * 0.3 + availableWidth - lineNumberWidth, y);
        hlGrad.addColorStop(0, colorUtils.withAlpha(hlRgb.r, hlRgb.g, hlRgb.b, highlightOpacity * highlightSpring * 0.5));
        hlGrad.addColorStop(0.5, colorUtils.withAlpha(hlRgb.r, hlRgb.g, hlRgb.b, highlightOpacity * highlightSpring));
        hlGrad.addColorStop(1, colorUtils.withAlpha(hlRgb.r, hlRgb.g, hlRgb.b, highlightOpacity * highlightSpring * 0.5));
        ctx.fillStyle = hlGrad;
        ctx.fillRect(contentX - fontSize * 0.3, y, availableWidth - lineNumberWidth, lineHeight);
        ctx.restore();

        ctx.save();
        const barGrad = drawUtils.premiumGradient(ctx, contentX - fontSize * 0.3, y, fontSize * 0.15, lineHeight, [highlightColor, colorUtils.lerpColor(highlightColor, '#ffffff', 0.3)], 180);
        ctx.fillStyle = barGrad;
        ctx.globalAlpha = 0.9 * highlightSpring;
        ctx.fillRect(contentX - fontSize * 0.3, y, fontSize * 0.15, lineHeight);
        ctx.restore();

        ctx.save();
        drawUtils.multiLayerGlow(ctx, contentX - fontSize * 0.3, y + lineHeight / 2, highlightColor, lineHeight * 1.5, 3);
        ctx.restore();
      }

      const tokens = highlightCode(line);
      let x = contentX;
      tokens.forEach(token => {
        ctx.save();
        const tokenRgb = colorUtils.hexToRgb(token.color);
        if (index === currentLineIndex) {
          ctx.fillStyle = token.color;
          ctx.shadowColor = token.color;
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = colorUtils.withAlpha(tokenRgb.r, tokenRgb.g, tokenRgb.b, 0.7);
        }
        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.text, x, y + lineHeight / 2);
        x += ctx.measureText(token.text).width;
        ctx.restore();
      });
    });

    if (showArrow && prevLineIndex !== currentLineIndex && currentStep > 0) {
      const prevY = startY + prevLineIndex * lineHeight + lineHeight / 2;
      const currentY = startY + currentLineIndex * lineHeight + lineHeight / 2;

      const arrowProgress = easing.spring(Math.min(1, stepProgress * 2), 200, 16, 1);
      const arrowY = prevY + (currentY - prevY) * arrowProgress;

      ctx.save();
      drawUtils.multiLayerGlow(ctx, contentX - fontSize * 0.7, arrowY, arrowColor, fontSize * 0.5, 3);
      ctx.fillStyle = arrowColor;
      ctx.beginPath();
      ctx.moveTo(contentX - fontSize, arrowY - fontSize * 0.4);
      ctx.lineTo(contentX - fontSize * 0.4, arrowY);
      ctx.lineTo(contentX - fontSize, arrowY + fontSize * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (showArrow) {
      const currentY = startY + currentLineIndex * lineHeight + lineHeight / 2;
      ctx.save();
      drawUtils.multiLayerGlow(ctx, contentX - fontSize * 0.7, currentY, arrowColor, fontSize * 0.5, 3);
      ctx.fillStyle = arrowColor;
      ctx.beginPath();
      ctx.moveTo(contentX - fontSize, currentY - fontSize * 0.4);
      ctx.lineTo(contentX - fontSize * 0.4, currentY);
      ctx.lineTo(contentX - fontSize, currentY + fontSize * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (bubbles[currentLineIndex] && stepProgress > 0.3) {
      const bubbleOpacity = Math.min((stepProgress - 0.3) / 0.3, 1);
      const bubbleY = startY + currentLineIndex * lineHeight + lineHeight;

      ctx.save();
      ctx.globalAlpha = easing.snapSpring(bubbleOpacity, 280, 26);

      const lineText = lines[currentLineIndex];
      ctx.font = `${fontSize}px 'Courier New', monospace`;
      const textWidth = ctx.measureText(lineText).width;
      const bubbleX = contentX + textWidth + fontSize;

      drawBubble(ctx, bubbleX, bubbleY, bubbles[currentLineIndex], {
        bubbleColor,
        bubbleTextColor,
        fontSize: fontSize * 0.9
      });

      ctx.restore();
    }

    ctx.save();
    const barY = height / 2 - height * 0.015;
    const barWidth = width * 0.9;
    const barX = -barWidth / 2;

    drawUtils.glassBackground(ctx, barX, barY, barWidth, height * 0.006, 3, 0.06, colorUtils.toRgba(highlightColor, 0.1));

    const progressEased = easing.snapSpring(progress, 250, 28);
    const activeBarWidth = barWidth * progressEased;
    if (activeBarWidth > 0) {
      const progGrad = drawUtils.premiumGradient(ctx, barX, barY, activeBarWidth, height * 0.006, [palettes.royal[4], palettes.royal[5], highlightColor], 90);
      ctx.fillStyle = progGrad;
      ctx.shadowColor = highlightColor;
      ctx.shadowBlur = 6;
      drawUtils.roundedRect(ctx, barX, barY, activeBarWidth, height * 0.006, 3);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    const borderP = (time * 0.4) % 1;
    drawUtils.borderBeam(ctx, codeBlockX, codeBlockY, codeBlockW, codeBlockH, 12, borderP, palettes.royal[4], palettes.royal[5], 40);
    ctx.restore();
  },

  initParams: (duration: number) => ({
    code: `const sum = (a, b) => {
  const result = a + b;
  return result;
};

const x = 5;
const y = 10;
const total = sum(x, y);
console.log(total);`,
    executionSequence: '1,3,4,5,6,7',
    variableBubbles: '3:result=15\n7:total=15',
    highlightColor: '#ffff00',
    highlightOpacity: 0.3,
    fontScale: 95,
    lineNumberColor: '#6272a4',
    bubbleColor: '#ff79c6',
    bubbleTextColor: '#ffffff',
    showArrow: true,
    arrowColor: '#ff79c6',
    codePaddingRatio: 2
  })
};
