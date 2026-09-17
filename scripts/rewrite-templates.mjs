/**
 * 模板系统性重写脚本
 * 目标：所有模板必须符合病毒式视频四大维度
 * - 材质与光学：真实质感、光影、WebGL 级效果（Canvas 2D 模拟）
 * - 物理与运动：弹簧、阻尼、惯性、弹性回弹、流体感
 * - 空间感：前景/中景/背景分层、3D 透视、深度模糊
 * - 风格与情绪：赛博朋克/终端/故障/情绪化节奏
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const templateDir = path.join(root, 'src', 'engine', 'templates');
const moduleTemplateDir = path.join(root, 'src', 'modules', 'template', 'categories');

function write(file, content) {
  const fullPath = path.join(templateDir, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`✅ ${file}`);
}

function del(file) {
  const fullPath = path.join(templateDir, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`🗑️  ${file}`);
  }
}

// ========== 1. 清理旧模板（保留工具文件、类型、测试、导入器） ==========
const keepFiles = new Set([
  'types.ts',
  'index.ts',
  'templateUtils.ts',
  'templateImporter.ts',
]);

const existing = fs.readdirSync(templateDir, { withFileTypes: true });
for (const entry of existing) {
  if (entry.isFile() && entry.name.endsWith('.ts') && !keepFiles.has(entry.name)) {
    del(entry.name);
  }
}

// 删除所有子目录（除了 __tests__）
for (const entry of existing) {
  if (entry.isDirectory() && entry.name !== '__tests__') {
    fs.rmSync(path.join(templateDir, entry.name), { recursive: true, force: true });
    console.log(`🗑️  dir ${entry.name}`);
  }
}

// ========== 2. 重写 templateUtils.ts：增强物理、材质、空间工具 ==========
const templateUtilsTs = `import { TemplateRenderContext } from './types';
import * as EasingLib from '../utils/easing';

export const easing = {
  linear: EasingLib.linear,
  easeInQuad: EasingLib.easeInQuad,
  easeOutQuad: EasingLib.easeOutQuad,
  easeInOutQuad: EasingLib.easeInOutQuad,
  easeInCubic: EasingLib.easeInCubic,
  easeOutCubic: EasingLib.easeOutCubic,
  easeInOutCubic: EasingLib.easeInOutCubic,
  easeInQuart: EasingLib.easeInQuart,
  easeOutQuart: EasingLib.easeOutQuart,
  easeInOutQuart: EasingLib.easeInOutQuart,
  easeInQuint: EasingLib.easeInQuint,
  easeOutQuint: EasingLib.easeOutQuint,
  easeInOutQuint: EasingLib.easeInOutQuint,
  easeInExpo: EasingLib.easeInExpo,
  easeOutExpo: EasingLib.easeOutExpo,
  easeInOutExpo: EasingLib.easeInOutExpo,
  easeOutElastic: EasingLib.easeOutElastic,
  easeOutBack: EasingLib.easeOutBack,
  easeOutBounce: EasingLib.easeOutBounce,
  easeInBounce: EasingLib.easeInBounce,
  easeInOutBounce: EasingLib.easeInOutBounce,
  spring: EasingLib.spring,
  springBounce: EasingLib.springBounce,
  criticalSpring: EasingLib.criticalSpring,
  gravityBounce: EasingLib.gravityBounce,
  momentumEase: EasingLib.momentumEase,
  snapSpring: EasingLib.snapSpring,
  elasticOut: EasingLib.elasticOut,
  whipEffect: EasingLib.whipEffect,
  inertiaDecay: EasingLib.inertiaDecay,
  perlinNoise1D: EasingLib.perlinNoise1D,
  dampedOscillation: EasingLib.dampedOscillation,
  bezierEase: EasingLib.bezierEase,
};

// 伪随机哈希（确定性）
export const hash = {
  float: (seed: number): number => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  },
  range: (seed: number, min: number, max: number): number => {
    return min + hash.float(seed) * (max - min);
  },
  int: (seed: number, min: number, max: number): number => {
    return Math.floor(hash.range(seed, min, max + 1));
  }
};

export const adaptiveLayout = {
  calculateFontSize: (
    ctx: CanvasRenderingContext2D,
    text: string,
    availableWidth: number,
    availableHeight: number,
    maxLines: number = 1
  ): number => {
    let fontSize = 10;
    const lineHeight = 1.3;
    while (fontSize < availableHeight / maxLines / lineHeight) {
      ctx.font = \`\${fontSize}px Arial\`;
      const metrics = ctx.measureText(text);
      if (metrics.width > availableWidth) {
        return fontSize - 1;
      }
      fontSize++;
    }
    return fontSize - 1;
  },
  calculateScale: (
    contentWidth: number,
    contentHeight: number,
    targetWidth: number,
    targetHeight: number,
    fillRatio: number = 0.95
  ): number => {
    const scaleX = (targetWidth * fillRatio) / contentWidth;
    const scaleY = (targetHeight * fillRatio) / contentHeight;
    return Math.min(scaleX, scaleY);
  },
  getAvailableSize: (
    width: number,
    height: number,
    fillRatio: number = 0.95
  ): { width: number; height: number } => {
    return { width: width * fillRatio, height: height * fillRatio };
  }
};

export const colorUtils = {
  adjustBrightness: (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return \`#\${r.toString(16).padStart(2, '0')}\${g.toString(16).padStart(2, '0')}\${b.toString(16).padStart(2, '0')}\`;
  },
  toRgba: (color: string, alpha: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
  },
  hexToRgb: (color: string): { r: number; g: number; b: number } => {
    const hex = color.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  },
  rgbToHsl: (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return { h: h * 360, s, l };
  },
  hslToRgb: (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360;
    let r: number, g: number, b: number;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  },
  lerpColor: (c1: string, c2: string, t: number): string => {
    const rgb1 = colorUtils.hexToRgb(c1);
    const rgb2 = colorUtils.hexToRgb(c2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    return \`#\${r.toString(16).padStart(2, '0')}\${g.toString(16).padStart(2, '0')}\${b.toString(16).padStart(2, '0')}\`;
  },
  withAlpha: (r: number, g: number, b: number, a: number): string => {
    return \`rgba(\${r}, \${g}, \${b}, \${a})\`;
  }
};

export const palettes = {
  cyberpunk: ['#ff003c', '#ff6b00', '#ffd000', '#00ff87', '#00d4ff', '#7b2ff7'],
  neon: ['#ff0080', '#ff00ff', '#8000ff', '#0040ff', '#00bfff', '#00ff80'],
  matrix: ['#000000', '#001100', '#003300', '#006600', '#00cc00', '#00ff00'],
  fire: ['#1a0000', '#4d0000', '#990000', '#ff1a1a', '#ff6600', '#ffcc00', '#ffff99'],
  galaxy: ['#0b0d17', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
  glass: ['#ffffff', '#e8f4f8', '#c5e4ed', '#a0d2db', '#7ec8c8'],
  premium: ['#0f0f0f', '#1a1a2e', '#2d2d44', '#e8d5b7', '#f5e6cc', '#ffffff'],
  dream: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
  ember: ['#0d0d0d', '#1a0a00', '#3d1500', '#7a2e00', '#cc5500', '#ff8800', '#ffbb33'],
  frost: ['#e8f4f8', '#c5e4ed', '#88d4e8', '#45b7d1', '#2e8ba6', '#1a659e'],
  terminal: ['#050a08', '#00ff9d', '#00cc6a', '#008f4b', '#ffffff'],
  hologram: ['#00f0ff', '#ff00a0', '#7b2ff7', '#0a0014'],
};

export const drawUtils = {
  roundedRect: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number, radius: number
  ): void => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },
  shadowRect: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number,
    color: string, shadowColor: string, shadowBlur: number,
    shadowOffsetX: number = 0, shadowOffsetY: number = 0
  ): void => {
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  },
  glow: (
    ctx: CanvasRenderingContext2D,
    color: string, intensity: number, callback: () => void
  ): void => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = intensity;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    callback();
    ctx.restore();
  },
  multiLayerGlow: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    color: string, radius: number, layers: number = 4
  ): void => {
    const rgb = colorUtils.hexToRgb(color.startsWith('#') ? color : '#ffffff');
    for (let i = layers; i >= 0; i--) {
      const t = i / layers;
      const r = radius * (1 + t * 2);
      const alpha = 0.08 * (1 - t);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, alpha * 2));
      grad.addColorStop(0.5, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, alpha));
      grad.addColorStop(1, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  },
  radialGlow: (
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, radius: number,
    color: string, intensity: number = 1
  ): void => {
    const rgb = colorUtils.hexToRgb(color.startsWith('#') ? color : '#ffffff');
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0.6 * intensity));
    grad.addColorStop(0.3, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0.3 * intensity));
    grad.addColorStop(0.6, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0.1 * intensity));
    grad.addColorStop(1, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  },
  vignette: (
    ctx: CanvasRenderingContext2D,
    width: number, height: number, intensity: number = 0.4,
    offsetX: number = 0, offsetY: number = 0
  ): void => {
    const grad = ctx.createRadialGradient(
      offsetX + width / 2, offsetY + height / 2, Math.min(width, height) * 0.3,
      offsetX + width / 2, offsetY + height / 2, Math.max(width, height) * 0.7
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, \`rgba(0, 0, 0, \${intensity})\`);
    ctx.fillStyle = grad;
    ctx.fillRect(offsetX, offsetY, width, height);
  },
  particle: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, radius: number,
    color: string, opacity: number = 1, softness: number = 0.8
  ): void => {
    const rgb = colorUtils.hexToRgb(color.startsWith('#') ? color : '#ffffff');
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, opacity));
    grad.addColorStop(softness, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, opacity * 0.5));
    grad.addColorStop(1, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  },
  noiseTexture: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number,
    opacity: number = 0.03, seed: number = 0
  ): void => {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1;
      const n = (noise - 0.5) * 255 * opacity;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(imageData, x, y);
  },
  scanlines: (
    ctx: CanvasRenderingContext2D,
    width: number, height: number,
    lineHeight: number = 4, opacity: number = 0.12
  ): void => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#000000';
    for (let y = -height / 2; y < height / 2; y += lineHeight * 2) {
      ctx.fillRect(-width / 2, y, width, lineHeight);
    }
    ctx.restore();
  },
  // 金属拉丝材质
  metalTexture: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number,
    baseColor: string = '#2a2a2a', reflection: number = 0.3
  ): void => {
    const rgb = colorUtils.hexToRgb(baseColor);
    ctx.save();
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const wave = Math.sin(t * Math.PI * 4) * 0.5 + 0.5;
      const alpha = reflection * (0.3 + wave * 0.7);
      grad.addColorStop(t, colorUtils.withAlpha(
        Math.min(255, rgb.r + 40 * wave),
        Math.min(255, rgb.g + 40 * wave),
        Math.min(255, rgb.b + 40 * wave),
        alpha
      ));
    }
    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  },
  // 碳纤维编织纹理
  carbonTexture: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number
  ): void => {
    ctx.save();
    ctx.strokeStyle = 'rgba(80,80,80,0.15)';
    ctx.lineWidth = 1;
    const size = 12;
    for (let i = -height; i < width + height; i += size) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + height, y + height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + i + width, y);
      ctx.lineTo(x + i + width - height, y + height);
      ctx.stroke();
    }
    ctx.restore();
  },
  // 玻璃折射高光
  glassHighlight: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number,
    radius: number, opacity: number = 0.2
  ): void => {
    ctx.save();
    drawUtils.roundedRect(ctx, x, y, width, height * 0.45, radius);
    const grad = ctx.createLinearGradient(x, y, x, y + height * 0.45);
    grad.addColorStop(0, \`rgba(255, 255, 255, \${opacity})\`);
    grad.addColorStop(0.5, \`rgba(255, 255, 255, \${opacity * 0.3})\`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  },
  // 3D 透视网格（空间感）
  perspectiveGrid: (
    ctx: CanvasRenderingContext2D,
    width: number, height: number,
    horizonY: number, time: number,
    color: string = '#00f0ff', speed: number = 1
  ): void => {
    const rgb = colorUtils.hexToRgb(color);
    const fov = 400;
    const spacingZ = 80;
    const offsetZ = (time * speed * 60) % spacingZ;

    ctx.save();
    ctx.strokeStyle = color;

    // 纵向汇聚线
    for (let i = -12; i <= 12; i++) {
      const x = i * width / 12;
      ctx.globalAlpha = 0.1 + 0.2 * (1 - Math.abs(i) / 12);
      ctx.beginPath();
      ctx.moveTo(x * 0.05, horizonY);
      ctx.lineTo(x * 4, height / 2);
      ctx.stroke();
    }

    // 横向深度线
    for (let z = 50; z < 2500; z += spacingZ) {
      const actualZ = z - offsetZ;
      if (actualZ <= 10) continue;
      const scale = fov / actualZ;
      const y = horizonY + (height / 2 - horizonY) * (1 - scale);
      if (y > height / 2 || y < horizonY) continue;
      const alpha = Math.min(0.5, scale * 1.2);
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1 + scale;
      ctx.beginPath();
      ctx.moveTo(-width, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 地平线辉光
    const horizonGrad = ctx.createLinearGradient(0, horizonY - 80, 0, horizonY + 160);
    horizonGrad.addColorStop(0, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0));
    horizonGrad.addColorStop(0.5, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0.2));
    horizonGrad.addColorStop(1, colorUtils.withAlpha(rgb.r, rgb.g, rgb.b, 0));
    ctx.fillStyle = horizonGrad;
    ctx.fillRect(-width / 2, horizonY - 80, width, 240);
  },
  // 流体波纹（物理运动）
  fluidRipple: (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number,
    time: number, color: string = '#00f0ff', frequency: number = 3
  ): void => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < frequency; i++) {
      ctx.globalAlpha = 0.1 + 0.2 * (1 - i / frequency);
      ctx.beginPath();
      for (let px = -width / 2; px <= width / 2; px += 10) {
        const py = y + Math.sin(px * 0.015 + time * 3 + i) * 20 * Math.exp(-Math.abs(px) / width);
        if (px === -width / 2) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
};

export const animationUtils = {
  loopProgress: (progress: number, cycles: number): number => {
    return (progress * cycles) % 1;
  },
  pingPong: (progress: number): number => {
    return 1 - Math.abs(progress * 2 - 1);
  },
  pulse: (progress: number, frequency: number = 1): number => {
    return (Math.sin(progress * Math.PI * 2 * frequency) + 1) / 2;
  },
  delay: (progress: number, delay: number): number => {
    return Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
  },
  stagger: (progress: number, index: number, total: number, overlap: number = 0.3): number => {
    const totalDuration = 1 + (total - 1) * (1 - overlap);
    const startTime = index * (1 - overlap);
    return Math.max(0, Math.min(1, (progress * totalDuration - startTime)));
  },
  // 弹性入场曲线
  elasticEnter: (t: number, overshoot: number = 1.2): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const s = Math.sin(t * Math.PI * (2.5 + overshoot)) * Math.exp(-t * 5);
    return t + s * 0.1 * (1 - t);
  }
};

export const paramGuard = {
  number: (value: any, defaultValue: number, min: number, max: number): number => {
    const num = typeof value === 'number' ? value : defaultValue;
    return Math.max(min, Math.min(max, num));
  },
  string: (value: any, defaultValue: string): string => {
    return typeof value === 'string' ? value : defaultValue;
  },
  boolean: (value: any, defaultValue: boolean): boolean => {
    return typeof value === 'boolean' ? value : defaultValue;
  },
  color: (value: any, defaultValue: string): string => {
    if (typeof value !== 'string') return defaultValue;
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(value) ? value : defaultValue;
  }
};

export abstract class TemplateBase {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;
  protected progress: number;
  protected time: number;
  protected duration: number;
  protected params: Record<string, any>;

  constructor(context: TemplateRenderContext) {
    this.ctx = context.ctx;
    this.width = context.width;
    this.height = context.height;
    this.progress = context.progress;
    this.time = context.time;
    this.duration = context.duration;
    this.params = context.params;
  }

  protected getAdaptiveSize(fillRatio: number = 0.95): { width: number; height: number } {
    return adaptiveLayout.getAvailableSize(this.width, this.height, fillRatio);
  }

  protected calculateAdaptiveFontSize(text: string, maxWidth: number, maxHeight: number, maxLines: number = 1): number {
    return adaptiveLayout.calculateFontSize(this.ctx, text, maxWidth, maxHeight, maxLines);
  }

  protected guardProgress(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  abstract render(): void;
}

export default {
  easing, adaptiveLayout, colorUtils, palettes, drawUtils, animationUtils, paramGuard, TemplateBase, hash
};
`;

write('templateUtils.ts', templateUtilsTs);

// ========== 3. 文字模板：高冲击力、真实材质、故障与解码 ==========

const textViralHookTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, colorUtils, easing, hash } from './templateUtils';

export const viralHookTemplate: TemplateDefinition = {
  id: 'text_viral_hook',
  name: '爆款钩子标题',
  description: '高冲击力大字标题，带 3D 厚重投影、金属质感、RGB 色差与 CRT 扫描线',
  category: 'text',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['metal', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'whipEffect'],
  schema: [
    { key: 'text', label: '标题文字', type: 'string', default: '被裁那天' },
    { key: 'fontSize', label: '字号', type: 'number', default: 160, min: 60, max: 320, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#ff0055' },
    { key: 'glitch', label: '故障强度', type: 'number', default: 0.6, min: 0, max: 1, step: 0.05 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '爆款钩子');
    const fontSize = paramGuard.number(params.fontSize, 160, 60, 320);
    const color = paramGuard.color(params.color, '#ff0055');
    const glitch = paramGuard.number(params.glitch, 0.6, 0, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    // 弹性缩放 + 阻尼 settle
    const springP = easing.spring(p, 160, 14, 1);
    const settle = p < 1 ? easing.dampedOscillation(p, 4, 0.25) * 0.015 * (1 - p) : 0;
    const scale = springP + settle;

    // 故障抖动偏移（带鞭子感）
    const seed = Math.floor(time * 18);
    const whip = p < 0.55 ? easing.whipEffect(p, 0.55) : 0;
    const gShift = glitch > 0
      ? (Math.sin(seed * 3.7) * 10 + Math.cos(seed * 2.1) * 8) * glitch * (1 - whip)
      : 0;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.font = \`900 \${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif\`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 3D 厚重投影层（空间深度）
    const layers = 10;
    for (let i = layers; i > 0; i--) {
      const alpha = 0.4 - i * 0.03;
      ctx.fillStyle = colorUtils.toRgba('#000000', alpha);
      ctx.fillText(text, gShift * 0.3 + i * 4, i * 5);
    }

    // 主文字 + 金属拉丝叠加
    ctx.fillStyle = color;
    ctx.fillText(text, gShift * 0.3, 0);

    // 内高光（模拟金属反光）
    ctx.globalCompositeOperation = 'source-atop';
    const metalGrad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    metalGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    metalGrad.addColorStop(0.25, 'rgba(255,255,255,0.15)');
    metalGrad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
    metalGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = metalGrad;
    ctx.fillText(text, gShift * 0.3, 0);

    ctx.globalCompositeOperation = 'source-over';

    // 霓虹外发光
    ctx.shadowColor = color;
    ctx.shadowBlur = 30 + 20 * Math.sin(time * 5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = colorUtils.toRgba('#ffffff', 0.7);
    ctx.strokeText(text, gShift * 0.3, 0);
    ctx.shadowBlur = 0;

    // RGB 分离残影
    if (glitch > 0 && p < 0.75) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,80,0.55)';
      ctx.fillText(text, gShift * 0.3 + 6 * glitch, 0);
      ctx.fillStyle = 'rgba(0,240,255,0.55)';
      ctx.fillText(text, gShift * 0.3 - 6 * glitch, 0);
    }

    ctx.restore();

    // 前景 CRT 扫描线
    drawUtils.scanlines(ctx, width, height, 3, 0.08);
  },
  initParams: () => ({
    text: '被裁那天',
    fontSize: 160,
    color: '#ff0055',
    glitch: 0.6,
  }),
};
`;

const textKineticTitleTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, colorUtils, easing, drawUtils } from './templateUtils';

export const kineticTitleTemplate: TemplateDefinition = {
  id: 'text_kinetic_title',
  name: '动力字标题',
  description: '逐字以弹簧物理弹跳进入，带有字间距呼吸感与 3D 纵深',
  category: 'text',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'gravityBounce', 'inertiaDecay'],
  schema: [
    { key: 'text', label: '标题文字', type: 'string', default: '收入翻倍' },
    { key: 'fontSize', label: '字号', type: 'number', default: 120, min: 40, max: 220, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#f6e05e' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '收入翻倍');
    const fontSize = paramGuard.number(params.fontSize, 120, 40, 220);
    const color = paramGuard.color(params.color, '#f6e05e');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    ctx.save();
    ctx.font = \`900 \${fontSize}px "Microsoft YaHei", sans-serif\`;
    ctx.textBaseline = 'middle';

    const chars = text.split('');
    const totalWidth = ctx.measureText(text).width;
    let x = -totalWidth / 2;

    chars.forEach((char, i) => {
      const stagger = Math.max(0, Math.min(1, (p * 1.4 - i * 0.08) / 0.6));
      const springY = easing.spring(stagger, 180, 12, 1) * (-fontSize * 0.6);
      const bounce = (1 - stagger) * Math.sin(stagger * Math.PI * 3) * fontSize * 0.1;
      const charW = ctx.measureText(char).width;

      // 3D 纵深偏移
      const depth = Math.sin(time * 2 + i) * 3;

      ctx.save();
      ctx.translate(x + charW / 2, springY + bounce + depth);
      ctx.scale(1 + springY * 0.0005, 1 + springY * 0.0005);

      // 主字
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.textAlign = 'center';
      ctx.fillText(char, 0, 0);
      ctx.shadowBlur = 0;

      // 金属高光
      ctx.globalCompositeOperation = 'source-atop';
      const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
      grad.addColorStop(0, 'rgba(255,255,255,0.8)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
      grad.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.fillText(char, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
      x += charW;
    });

    ctx.restore();
    drawUtils.vignette(ctx, width, height, 0.35);
  },
  initParams: () => ({
    text: '收入翻倍',
    fontSize: 120,
    color: '#f6e05e',
  }),
};
`;

const textGlitchTitleTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, colorUtils, easing, drawUtils } from './templateUtils';

export const glitchTitleTemplate: TemplateDefinition = {
  id: 'text_glitch_title',
  name: '故障大标题',
  description: '赛博故障风格标题，带 RGB 分离、扫描错位、数据块闪烁',
  category: 'text',
  quality: 'viral',
  mood: ['tension', 'mysterious'],
  material: ['neon', 'carbon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'perlinNoise1D'],
  schema: [
    { key: 'text', label: '标题文字', type: 'string', default: '所有人觉得我完了' },
    { key: 'fontSize', label: '字号', type: 'number', default: 90, min: 40, max: 200, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#a855f7' },
    { key: 'intensity', label: '故障强度', type: 'number', default: 0.8, min: 0, max: 1, step: 0.05 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '所有人觉得我完了');
    const fontSize = paramGuard.number(params.fontSize, 90, 40, 200);
    const color = paramGuard.color(params.color, '#a855f7');
    const intensity = paramGuard.number(params.intensity, 0.8, 0, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const enter = easing.easeOutExpo(Math.min(1, p * 2));
    const flicker = Math.sin(time * 20) > 0.7 ? 1 : 0;
    const seed = Math.floor(time * 15);
    const shiftX = (Math.sin(seed * 4.1) * 12 + Math.cos(seed * 2.7) * 8) * intensity * (1 - p * 0.5);

    ctx.save();
    ctx.globalAlpha = enter;
    ctx.font = \`900 \${fontSize}px "Microsoft YaHei", monospace\`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 背景数据块（空间后景）
    ctx.save();
    ctx.globalAlpha = 0.08 * intensity;
    for (let i = 0; i < 12; i++) {
      const h = hash.float(seed + i);
      const bx = -width / 2 + h * width;
      const by = -height / 2 + hash.float(seed + i + 100) * height;
      ctx.fillStyle = i % 2 === 0 ? '#ff0055' : '#00f0ff';
      ctx.fillRect(bx + shiftX, by, 40 + h * 120, 3 + h * 10);
    }
    ctx.restore();

    // 主文字
    ctx.fillStyle = color;
    ctx.fillText(text, shiftX * 0.2, 0);

    // 多层阴影纵深
    for (let i = 5; i > 0; i--) {
      ctx.fillStyle = colorUtils.toRgba('#000000', 0.25 - i * 0.04);
      ctx.fillText(text, shiftX * 0.2 + i * 3, i * 4);
    }

    // RGB 分离
    if (intensity > 0.2 && p < 0.85) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,80,0.6)';
      ctx.fillText(text, shiftX * 0.2 + 8 * intensity + flicker * 4, 0);
      ctx.fillStyle = 'rgba(0,240,255,0.6)';
      ctx.fillText(text, shiftX * 0.2 - 8 * intensity - flicker * 4, 0);
    }

    // 随机切片错位
    if (intensity > 0.4 && p < 0.8) {
      ctx.globalCompositeOperation = 'source-over';
      const sliceCount = Math.floor(3 + intensity * 6);
      for (let i = 0; i < sliceCount; i++) {
        const sy = -fontSize / 2 + hash.float(seed + i * 13) * fontSize;
        const sh = 4 + hash.float(seed + i * 7) * 20;
        const sx = shiftX * (0.5 + hash.float(seed + i * 19));
        ctx.save();
        ctx.beginPath();
        ctx.rect(-width / 2, sy, width, sh);
        ctx.clip();
        ctx.fillStyle = color;
        ctx.fillText(text, sx, 0);
        ctx.restore();
      }
    }

    ctx.restore();
    drawUtils.scanlines(ctx, width, height, 4, 0.1);
  },
  initParams: () => ({
    text: '所有人觉得我完了',
    fontSize: 90,
    color: '#a855f7',
    intensity: 0.8,
  }),
};
`;

const textNeonScrambleTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const neonScrambleTemplate: TemplateDefinition = {
  id: 'text_neon_scramble',
  name: '霓虹乱码解码',
  description: '从随机字符解码为目标文字，伴随霓虹发光与 CRT 闪烁',
  category: 'text',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation'],
  schema: [
    { key: 'text', label: '目标文字', type: 'string', default: 'INDEPENDENT' },
    { key: 'fontSize', label: '字号', type: 'number', default: 100, min: 40, max: 200, step: 10 },
    { key: 'color', label: '主色', type: 'color', default: '#00ff9d' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, 'INDEPENDENT');
    const fontSize = paramGuard.number(params.fontSize, 100, 40, 200);
    const color = paramGuard.color(params.color, '#00ff9d');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const displayText = text.split('').map((c, i) => {
      const charP = Math.max(0, Math.min(1, (p * 1.3 - i * 0.05) / 0.7));
      const settled = easing.spring(charP, 160, 12, 1);
      if (settled > 0.98) return c;
      return chars[Math.floor(hash.float(Math.floor(time * 20) + i) * chars.length)];
    }).join('');

    ctx.save();
    ctx.font = \`900 \${fontSize}px "Microsoft YaHei", monospace\`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 霓虹多层发光
    ctx.shadowColor = color;
    ctx.shadowBlur = 50;
    ctx.fillStyle = color;
    ctx.fillText(displayText, 0, 0);

    ctx.shadowBlur = 100;
    ctx.globalAlpha = 0.5;
    ctx.fillText(displayText, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // 内部高亮
    ctx.globalCompositeOperation = 'source-atop';
    const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillText(displayText, 0, 0);

    ctx.restore();
    drawUtils.scanlines(ctx, width, height, 3, 0.06);
  },
  initParams: () => ({
    text: 'INDEPENDENT',
    fontSize: 100,
    color: '#00ff9d',
  }),
};
`;

const textCountUpFireTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, colorUtils, easing, drawUtils } from './templateUtils';

export const countUpFireTemplate: TemplateDefinition = {
  id: 'text_countup_fire',
  name: '数字燃烧增长',
  description: '大额数字弹簧增长，带火焰色渐变、粒子尾迹与金属质感',
  category: 'text',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['metal', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'gravityBounce', 'inertiaDecay'],
  schema: [
    { key: 'value', label: '目标数值', type: 'number', default: 52000 },
    { key: 'prefix', label: '前缀', type: 'string', default: '+¥' },
    { key: 'fontSize', label: '字号', type: 'number', default: 180, min: 60, max: 300, step: 10 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const value = paramGuard.number(params.value, 52000, 0, 10000000);
    const prefix = paramGuard.string(params.prefix, '+¥');
    const fontSize = paramGuard.number(params.fontSize, 180, 60, 300);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const current = Math.floor(value * easing.spring(Math.min(1, p * 1.2), 140, 14, 1));
    const text = \`\${prefix}\${current.toLocaleString()}\`;

    ctx.save();
    ctx.font = \`900 \${fontSize}px "Microsoft YaHei", sans-serif\`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 数字跳动回弹
    const bounce = p < 1 ? Math.sin(p * Math.PI * 4) * fontSize * 0.03 * (1 - p) : 0;
    const scale = 1 + bounce * 0.01;
    ctx.translate(0, bounce);
    ctx.scale(scale, scale);

    // 渐变文字
    const grad = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    grad.addColorStop(0, '#ffcc00');
    grad.addColorStop(0.4, '#ff6600');
    grad.addColorStop(0.8, '#ff1a1a');
    grad.addColorStop(1, '#ffffff');

    // 发光阴影
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 40 + 20 * Math.sin(time * 6);
    ctx.fillStyle = grad;
    ctx.fillText(text, 0, 0);
    ctx.shadowBlur = 0;

    // 金属高光
    ctx.globalCompositeOperation = 'source-atop';
    const shine = ctx.createLinearGradient(0, -fontSize / 2, 0, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0.9)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillText(text, 0, 0);

    ctx.restore();

    // 漂浮火星粒子
    ctx.save();
    for (let i = 0; i < 20; i++) {
      const seed = i * 97;
      const px = (hash.float(seed + time) - 0.5) * width * 0.6;
      const py = height / 2 - (hash.float(seed + time * 0.5) * height * 0.4);
      const size = 2 + hash.float(seed) * 4;
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * 4 + i);
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
  initParams: () => ({
    value: 52000,
    prefix: '+¥',
    fontSize: 180,
  }),
};
`;

const textCyberSubtitleTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const cyberSubtitleTemplate: TemplateDefinition = {
  id: 'text_cyber_subtitle',
  name: '赛博副标题',
  description: '终端风格副标题，带打字机效果、光标闪烁与代码行背景',
  category: 'text',
  quality: 'viral',
  mood: ['mysterious', 'calm'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation'],
  schema: [
    { key: 'text', label: '副标题文字', type: 'string', default: '这不是鸡汤，是普通人能复制的路径' },
    { key: 'fontSize', label: '字号', type: 'number', default: 56, min: 24, max: 120, step: 4 },
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '这不是鸡汤，是普通人能复制的路径');
    const fontSize = paramGuard.number(params.fontSize, 56, 24, 120);
    const color = paramGuard.color(params.color, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const typeProgress = Math.min(text.length, Math.floor(text.length * easing.easeOutExpo(p)));
    const displayText = text.slice(0, typeProgress);

    ctx.save();
    ctx.font = \`600 \${fontSize}px "Microsoft YaHei", monospace\`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 背景代码行
    const metrics = ctx.measureText(text);
    const pad = 40;
    const boxW = metrics.width + pad * 2;
    const boxH = fontSize + pad;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.globalAlpha = 1;

    // 文字 + 发光
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(displayText, 0, 0);
    ctx.shadowBlur = 0;

    // 光标
    if (p < 1 && Math.floor(time * 12) % 2 === 0) {
      const cursorX = -metrics.width / 2 + ctx.measureText(displayText).width + 4;
      ctx.fillStyle = color;
      ctx.fillRect(cursorX, -fontSize / 3, 3, fontSize * 0.7);
    }

    ctx.restore();
    drawUtils.scanlines(ctx, width, height, 4, 0.05);
  },
  initParams: () => ({
    text: '这不是鸡汤，是普通人能复制的路径',
    fontSize: 56,
    color: '#00f0ff',
  }),
};
`;

write('text/viralHook.ts', textViralHookTs);
write('text/kineticTitle.ts', textKineticTitleTs);
write('text/glitchTitle.ts', textGlitchTitleTs);
write('text/neonScramble.ts', textNeonScrambleTs);
write('text/countUpFire.ts', textCountUpFireTs);
write('text/cyberSubtitle.ts', textCyberSubtitleTs);

// ========== 4. UI 模板：玻璃、金属、碳纤维、全息 ==========

const uiGlassCardTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, colorUtils, drawUtils, easing } from './templateUtils';

export const glassCardTemplate: TemplateDefinition = {
  id: 'ui_glass_card',
  name: '玻璃卡片',
  description: '磨砂玻璃质感卡片，带折射高光、边缘辉光与弹性入场',
  category: 'ui',
  quality: 'viral',
  mood: ['calm', 'mysterious'],
  material: ['glass', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation'],
  schema: [
    { key: 'title', label: '标题', type: 'string', default: 'AI 收益概览' },
    { key: 'amount', label: '金额', type: 'string', default: '¥ 89,420.00' },
    { key: 'changeRate', label: '涨跌幅', type: 'string', default: '+28.5%' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const title = paramGuard.string(params.title, 'AI 收益概览');
    const amount = paramGuard.string(params.amount, '¥ 89,420.00');
    const changeRate = paramGuard.string(params.changeRate, '+28.5%');
    const accentColor = paramGuard.color(params.accentColor, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const cardW = 560;
    const cardH = 300;
    const radius = 24;

    // 弹性入场
    const scale = easing.spring(p, 160, 14, 1);
    const settle = p < 1 ? easing.dampedOscillation(p, 3, 0.2) * 0.02 * (1 - p) : 0;

    ctx.save();
    ctx.scale(scale + settle, scale + settle);

    // 背景辉光
    drawUtils.multiLayerGlow(ctx, 0, 0, accentColor, 160, 5);

    // 磨砂玻璃底
    drawUtils.roundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // 玻璃边框
    ctx.strokeStyle = colorUtils.toRgba(accentColor, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 折射高光
    drawUtils.glassHighlight(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius, 0.25);

    // 标题
    ctx.font = '600 32px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(title, -cardW / 2 + 40, -cardH / 2 + 70);

    // 金额
    ctx.font = '900 72px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 20;
    ctx.fillText(amount, -cardW / 2 + 40, 10);
    ctx.shadowBlur = 0;

    // 涨跌幅标签
    const tagW = 140;
    const tagH = 44;
    const tagX = -cardW / 2 + 40;
    const tagY = 60;
    drawUtils.roundedRect(ctx, tagX, tagY, tagW, tagH, 8);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = accentColor;
    ctx.font = '700 24px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(changeRate, tagX + tagW / 2, tagY + tagH / 2);

    // 装饰数据条
    for (let i = 0; i < 4; i++) {
      const bw = 60 + Math.sin(time * 2 + i) * 20;
      const bx = 120 + i * 90;
      const by = -cardH / 2 + 120;
      ctx.fillStyle = colorUtils.toRgba(accentColor, 0.25);
      ctx.fillRect(bx, by, bw, 8);
    }

    ctx.restore();
  },
  initParams: () => ({
    title: 'AI 收益概览',
    amount: '¥ 89,420.00',
    changeRate: '+28.5%',
    accentColor: '#00f0ff',
  }),
};
`;

const uiMetalButtonTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, colorUtils, drawUtils, easing } from './templateUtils';

export const metalButtonTemplate: TemplateDefinition = {
  id: 'ui_metal_button',
  name: '金属按钮',
  description: '拉丝金属按钮，带 3D 浮雕、边缘高光与弹性按压反馈',
  category: 'ui',
  quality: 'viral',
  mood: ['urgency', 'excitement'],
  material: ['metal', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'gravityBounce'],
  schema: [
    { key: 'text', label: '按钮文字', type: 'string', default: '立即行动' },
    { key: 'color', label: '主色', type: 'color', default: '#ff0055' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const text = paramGuard.string(params.text, '立即行动');
    const color = paramGuard.color(params.color, '#ff0055');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const btnW = 420;
    const btnH = 110;
    const radius = 16;

    const scale = easing.spring(p, 160, 14, 1);
    const pulse = 1 + Math.sin(time * 6) * 0.015;

    ctx.save();
    ctx.scale(scale * pulse, scale * pulse);

    // 外发光
    drawUtils.multiLayerGlow(ctx, 0, 0, color, 120, 4);

    // 金属底座
    drawUtils.roundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, radius);
    const baseGrad = ctx.createLinearGradient(0, -btnH / 2, 0, btnH / 2);
    baseGrad.addColorStop(0, '#3a3a3a');
    baseGrad.addColorStop(0.5, '#1a1a1a');
    baseGrad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = baseGrad;
    ctx.fill();

    // 拉丝纹理
    drawUtils.metalTexture(ctx, -btnW / 2, -btnH / 2, btnW, btnH, '#1a1a1a', 0.35);

    // 顶部高光
    const topGrad = ctx.createLinearGradient(0, -btnH / 2, 0, 0);
    topGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
    topGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    drawUtils.roundedRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH / 2, radius);
    ctx.fill();

    // 边缘霓虹
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 文字
    ctx.font = '900 48px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillText(text, 0, 2);
    ctx.shadowBlur = 0;

    ctx.restore();
  },
  initParams: () => ({
    text: '立即行动',
    color: '#ff0055',
  }),
};
`;

const uiHologramFrameTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const hologramFrameTemplate: TemplateDefinition = {
  id: 'ui_hologram_frame',
  name: '全息边框',
  description: '全息投影风格边框，带扫描光、透视网格与抖动残影',
  category: 'ui',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['hologram', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'perlinNoise1D'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'content', label: '内容文字', type: 'string', default: 'STATUS: INDEPENDENT' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00f0ff');
    const content = paramGuard.string(params.content, 'STATUS: INDEPENDENT');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const frameW = 720;
    const frameH = 420;
    const enter = easing.easeOutExpo(p);

    ctx.save();
    ctx.globalAlpha = enter;

    // 全息抖动
    const jitter = Math.sin(time * 30) * 1.5;
    ctx.translate(jitter, jitter * 0.5);

    // 角标
    const corner = 40;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    const drawCorner = (x: number, y: number, dx: number, dy: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy * corner);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx * corner, y);
      ctx.stroke();
    };
    drawCorner(-frameW / 2, -frameH / 2, 1, 1);
    drawCorner(frameW / 2, -frameH / 2, -1, 1);
    drawCorner(-frameW / 2, frameH / 2, 1, -1);
    drawCorner(frameW / 2, frameH / 2, -1, -1);
    ctx.shadowBlur = 0;

    // 扫描光束
    const scanY = -frameH / 2 + (time * 120) % frameH;
    const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    scanGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    scanGrad.addColorStop(0.5, color.replace('#', 'rgba(') + ',0.3)'.replace(')', ''));
    scanGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(-frameW / 2, scanY - 30, frameW, 60);

    // 内容文字
    ctx.font = '700 42px "Microsoft YaHei", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillText(content, 0, 0);
    ctx.shadowBlur = 0;

    // 全息残影
    ctx.globalAlpha = 0.15 * enter;
    ctx.fillStyle = '#ff00a0';
    ctx.fillText(content, 4, 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(content, -4, -2);

    ctx.restore();
  },
  initParams: () => ({
    color: '#00f0ff',
    content: 'STATUS: INDEPENDENT',
  }),
};
`;

const uiCarbonPanelTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const carbonPanelTemplate: TemplateDefinition = {
  id: 'ui_carbon_panel',
  name: '碳纤维面板',
  description: '碳纤维编织纹理面板，带金属螺丝、数据条与机械感入场',
  category: 'ui',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['carbon', 'metal'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'inertiaDecay'],
  schema: [
    { key: 'title', label: '标题', type: 'string', default: '系统状态' },
    { key: 'value', label: '数值', type: 'string', default: 'ONLINE' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00ff9d' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, params } = context;
    const title = paramGuard.string(params.title, '系统状态');
    const value = paramGuard.string(params.value, 'ONLINE');
    const accentColor = paramGuard.color(params.accentColor, '#00ff9d');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.clearRect(-width / 2, -height / 2, width, height);

    const panelW = 600;
    const panelH = 240;
    const radius = 8;

    const scale = easing.spring(p, 160, 14, 1);

    ctx.save();
    ctx.scale(scale, scale);

    // 面板底色
    drawUtils.roundedRect(ctx, -panelW / 2, -panelH / 2, panelW, panelH, radius);
    ctx.fillStyle = '#111111';
    ctx.fill();

    // 碳纤维纹理
    drawUtils.carbonTexture(ctx, -panelW / 2, -panelH / 2, panelW, panelH);

    // 边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 四个螺丝
    ctx.fillStyle = '#888888';
    const screwOffset = 16;
    [
      [-panelW / 2 + screwOffset, -panelH / 2 + screwOffset],
      [panelW / 2 - screwOffset, -panelH / 2 + screwOffset],
      [-panelW / 2 + screwOffset, panelH / 2 - screwOffset],
      [panelW / 2 - screwOffset, panelH / 2 - screwOffset],
    ].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 标题
    ctx.font = '700 32px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(title, -panelW / 2 + 40, -panelH / 2 + 60);

    // 数值
    ctx.font = '900 72px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 25;
    ctx.fillText(value, -panelW / 2 + 40, 20);
    ctx.shadowBlur = 0;

    // 进度条
    const barY = panelH / 2 - 50;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-panelW / 2 + 40, barY, panelW - 80, 12);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-panelW / 2 + 40, barY, (panelW - 80) * scale, 12);

    ctx.restore();
  },
  initParams: () => ({
    title: '系统状态',
    value: 'ONLINE',
    accentColor: '#00ff9d',
  }),
};
`;

write('ui/glassCard.ts', uiGlassCardTs);
write('ui/metalButton.ts', uiMetalButtonTs);
write('ui/hologramFrame.ts', uiHologramFrameTs);
write('ui/carbonPanel.ts', uiCarbonPanelTs);

// ========== 5. 背景模板：空间纵深、透视网格、粒子隧道 ==========

const bgMatrixRainTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing, hash } from './templateUtils';

export const matrixRainTemplate: TemplateDefinition = {
  id: 'bg_matrix_rain',
  name: '矩阵代码雨',
  description: '多层纵深矩阵雨，前景快速、中景清晰、背景模糊，带 CRT 扫描线',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'tension'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['gravityBounce', 'inertiaDecay'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00ff9d' },
    { key: 'density', label: '密度', type: 'number', default: 60, min: 20, max: 150, step: 10 },
    { key: 'speed', label: '速度', type: 'number', default: 1.5, min: 0.5, max: 4, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00ff9d');
    const density = paramGuard.number(params.density, 60, 20, 150);
    const speed = paramGuard.number(params.speed, 1.5, 0.5, 4);
    const p = paramGuard.number(progress, 0, 0, 1);

    // 背景渐变
    const bg = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    bg.addColorStop(0, '#000000');
    bg.addColorStop(1, '#001100');
    ctx.fillStyle = bg;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const chars = 'ｱｲｳｴｵｶｷｸｹｺﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789';
    const layers = [
      { z: 0.3, alpha: 0.25, blur: 0, size: 16, speedMul: 0.4 },
      { z: 0.6, alpha: 0.55, blur: 0, size: 22, speedMul: 0.75 },
      { z: 1.0, alpha: 0.9, blur: 0, size: 28, speedMul: 1.2 },
    ];

    layers.forEach(layer => {
      ctx.save();
      ctx.font = \`\${layer.size}px monospace\`;
      ctx.textAlign = 'center';
      const cols = Math.floor(width / (layer.size * 1.5));
      for (let i = 0; i < cols * density / 60; i++) {
        const seed = i * 137 + Math.floor(layer.z * 10);
        const x = -width / 2 + (hash.float(seed) * cols + 0.5) * layer.size * 1.5;
        const headY = -height / 2 + ((time * speed * 80 * layer.speedMul + hash.float(seed + 1) * height * 2) % (height * 1.5));
        const tailLen = 6 + hash.int(seed + 2, 4, 14);
        for (let j = 0; j < tailLen; j++) {
          const y = headY - j * layer.size * 1.2;
          if (y < -height / 2 || y > height / 2) continue;
          const charIndex = Math.floor((time * 10 * layer.speedMul + i * 7 + j * 3) % chars.length);
          const alpha = layer.alpha * (1 - j / tailLen) * p;
          ctx.fillStyle = j === 0 ? '#ffffff' : color.replace('#', 'rgba(').replace(')', \`,\${alpha})\`);
          ctx.globalAlpha = alpha;
          ctx.fillText(chars[charIndex], x, y);
        }
      }
      ctx.restore();
    });

    drawUtils.scanlines(ctx, width, height, 4, 0.08);
    drawUtils.vignette(ctx, width, height, 0.5);
  },
  initParams: () => ({
    color: '#00ff9d',
    density: 60,
    speed: 1.5,
  }),
};
`;

const bgCyberTerminalTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const cyberTerminalTemplate: TemplateDefinition = {
  id: 'bg_cyber_terminal',
  name: '赛博终端 (CRT)',
  description: 'CRT 显示器效果：扫描线、荧光衰减、终端绿字、曲率暗角',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'tension'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation'],
  schema: [
    { key: 'textColor', label: '文字颜色', type: 'color', default: '#00ff9d' },
    { key: 'bgColor', label: '背景颜色', type: 'color', default: '#050a08' },
    { key: 'scanlineOpacity', label: '扫描线透明度', type: 'number', default: 0.25, min: 0, max: 1, step: 0.05 },
    { key: 'flicker', label: '闪烁强度', type: 'number', default: 0.08, min: 0, max: 0.5, step: 0.01 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const textColor = params.textColor || '#00ff9d';
    const bgColor = params.bgColor || '#050a08';
    const scanlineOpacity = Math.max(0, Math.min(1, params.scanlineOpacity ?? 0.25));
    const flicker = Math.max(0, Math.min(0.5, params.flicker ?? 0.08));
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = bgColor;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 径向渐变光晕
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.7);
    glow.addColorStop(0, 'rgba(0, 255, 157, 0.08)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 终端文字流
    ctx.save();
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    const lines = [
      '> system.boot --target=ai_core',
      '> loading neural weights... [OK]',
      '> optimize.income_stream --leverage=AI',
      '> execute.career_pivot --mode=aggressive',
      '> revenue.log: +¥52,000.00',
      '> status: INDEPENDENT',
      '> _',
    ];
    const lineHeight = 32;
    const startY = -height / 2 + 90;
    const offset = (time * 45) % lineHeight;
    for (let i = 0; i < 22; i++) {
      const y = startY + i * lineHeight - offset;
      if (y < -height / 2 || y > height / 2) continue;
      const line = lines[(i + Math.floor(time)) % lines.length];
      const alpha = (0.2 + 0.45 * (1 - Math.abs(y) / (height / 2))) * p;
      ctx.fillStyle = \`rgba(0, 255, 157, \${alpha})\`;
      ctx.fillText(line, -width / 2 + 70, y);
    }
    ctx.restore();

    // 扫描线
    drawUtils.scanlines(ctx, width, height, 4, scanlineOpacity);

    // 移动扫描光束
    const beamY = -height / 2 + (time * 140) % height;
    const beamGrad = ctx.createLinearGradient(0, beamY - 50, 0, beamY + 50);
    beamGrad.addColorStop(0, 'rgba(0, 255, 157, 0)');
    beamGrad.addColorStop(0.5, \`rgba(0, 255, 157, \${0.25 + flicker})\`);
    beamGrad.addColorStop(1, 'rgba(0, 255, 157, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-width / 2, beamY - 50, width, 100);

    // CRT 曲率暗角
    const vignette = ctx.createRadialGradient(0, 0, width * 0.3, 0, 0, width * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.8, 'rgba(0,0,0,0.35)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 闪烁
    ctx.fillStyle = \`rgba(0, 255, 157, \${(Math.random() - 0.5) * flicker})\`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  },
  initParams: () => ({
    textColor: '#00ff9d',
    bgColor: '#050a08',
    scanlineOpacity: 0.25,
    flicker: 0.08,
  }),
};
`;

const bgHologramGridTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const hologramGridTemplate: TemplateDefinition = {
  id: 'bg_hologram_grid',
  name: '全息网格',
  description: '3D 透视全息网格，带深度感和发光地平线，前景粒子掠过的空间层次',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['hologram', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'inertiaDecay'],
  schema: [
    { key: 'gridColor', label: '网格颜色', type: 'color', default: '#00f0ff' },
    { key: 'horizonGlow', label: '地平线辉光', type: 'color', default: '#ff00a0' },
    { key: 'speed', label: '移动速度', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const gridColor = params.gridColor || '#00f0ff';
    const horizonGlow = params.horizonGlow || '#ff00a0';
    const speed = Math.max(0.2, Math.min(3, params.speed ?? 1));
    const p = paramGuard.number(progress, 0, 0, 1);

    // 深空背景
    const bg = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    bg.addColorStop(0, '#020205');
    bg.addColorStop(0.5, '#0a0014');
    bg.addColorStop(1, '#020205');
    ctx.fillStyle = bg;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 地平线辉光
    const horizonY = height * 0.25;
    const horizon = ctx.createLinearGradient(0, horizonY - 100, 0, horizonY + 200);
    horizon.addColorStop(0, 'rgba(255, 0, 160, 0)');
    horizon.addColorStop(0.5, 'rgba(255, 0, 160, 0.25)');
    horizon.addColorStop(1, 'rgba(255, 0, 160, 0)');
    ctx.fillStyle = horizon;
    ctx.fillRect(-width / 2, horizonY - 100, width, 300);

    // 3D 透视网格
    drawUtils.perspectiveGrid(ctx, width, height, height * 0.35, time, gridColor, speed);

    // 前景快速掠过粒子
    ctx.save();
    for (let i = 0; i < 25; i++) {
      const seed = i * 137;
      const x = ((seed * 59) % width) - width / 2;
      const y = -height / 2 + ((time * speed * 60 + seed) % height);
      const size = 2 + (seed % 4);
      ctx.globalAlpha = 0.3 + 0.4 * Math.sin(time * 3 + i);
      ctx.fillStyle = gridColor;
      ctx.fillRect(x, y, size * 3, size);
    }
    ctx.restore();

    // 暗角
    drawUtils.vignette(ctx, width, height, 0.45);
  },
  initParams: () => ({
    gridColor: '#00f0ff',
    horizonGlow: '#ff00a0',
    speed: 1,
  }),
};
`;

const bgNeonCityTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, colorUtils, easing, hash } from './templateUtils';

export const neonCityTemplate: TemplateDefinition = {
  id: 'bg_neon_city',
  name: '霓虹都市',
  description: '赛博朋克城市天际线，三层纵深建筑、霓虹招牌、路面反射与雾气',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'mysterious'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['inertiaDecay', 'dampedOscillation'],
  schema: [
    { key: 'speed', label: '流动速度', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1 },
    { key: 'density', label: '建筑密度', type: 'number', default: 18, min: 8, max: 30, step: 1 },
    { key: 'color1', label: '霓虹色1', type: 'color', default: '#ff00cc' },
    { key: 'color2', label: '霓虹色2', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const speed = paramGuard.number(params.speed, 1, 0.2, 3);
    const density = paramGuard.number(params.density, 18, 8, 30);
    const color1 = paramGuard.color(params.color1, '#ff00cc');
    const color2 = paramGuard.color(params.color2, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    // 夜空背景
    const bgGrad = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    bgGrad.addColorStop(0, '#0a0014');
    bgGrad.addColorStop(0.5, '#120024');
    bgGrad.addColorStop(1, '#00101a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 远景模糊城市剪影（缓慢移动）
    ctx.save();
    ctx.globalAlpha = 0.3 * p;
    ctx.filter = 'blur(4px)';
    ctx.fillStyle = '#080018';
    const farOffset = (time * 8 * speed) % width;
    for (let i = -1; i <= density + 1; i++) {
      const h = hash.range(i * 3.7, 80, 260);
      const w = hash.range(i * 5.3, 30, 60);
      const x = -width / 2 + i * (width / density) - farOffset;
      ctx.fillRect(x, height / 2 - h, w, h);
    }
    ctx.filter = 'none';
    ctx.restore();

    // 中景建筑剪影
    ctx.save();
    ctx.globalAlpha = 0.7 * p;
    ctx.fillStyle = '#0d0020';
    const midOffset = (time * 18 * speed) % width;
    for (let i = -1; i <= density; i++) {
      const h = hash.range(i * 2.3 + 99, 120, 380);
      const w = hash.range(i * 4.1 + 17, 45, 80);
      const x = -width / 2 + i * (width / density) - midOffset;
      ctx.fillRect(x, height / 2 - h, w, h);

      // 窗户光点
      ctx.fillStyle = hash.float(i * 7) > 0.5 ? color1 : color2;
      ctx.globalAlpha = 0.35 * p;
      const rows = Math.floor(h / 28);
      const cols = Math.floor(w / 16);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (hash.float(i * 7 + r * 3 + c * 2) > 0.55) {
            ctx.fillRect(x + 5 + c * 13, height / 2 - h + 12 + r * 25, 5, 8);
          }
        }
      }
      ctx.globalAlpha = 0.7 * p;
      ctx.fillStyle = '#0d0020';
    }
    ctx.restore();

    // 霓虹招牌横条
    ctx.save();
    ctx.globalAlpha = 0.85 * p;
    const neonCount = 8;
    for (let i = 0; i < neonCount; i++) {
      const y = -height / 2 + 140 + i * 85 + Math.sin(i + time) * 25;
      const alpha = 0.5 + 0.35 * Math.sin(time * 2 + i);
      ctx.strokeStyle = i % 2 === 0 ? color1 : color2;
      ctx.lineWidth = 2 + (i % 3);
      ctx.globalAlpha = alpha * p;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      const segmentW = 70 + (i * 25);
      for (let x = -width / 2; x < width / 2; x += segmentW) {
        if ((x / segmentW + i) % 2 === 0) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + segmentW * 0.7, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 路面反射
    ctx.save();
    ctx.globalAlpha = 0.25 * p;
    const roadGrad = ctx.createLinearGradient(0, height / 2 - 90, 0, height / 2);
    roadGrad.addColorStop(0, colorUtils.toRgba(color1, 0));
    roadGrad.addColorStop(0.5, colorUtils.toRgba(color2, 0.45));
    roadGrad.addColorStop(1, colorUtils.toRgba(color1, 0));
    ctx.fillStyle = roadGrad;
    ctx.fillRect(-width / 2, height / 2 - 90, width, 90);
    ctx.restore();

    // 雾气光晕
    drawUtils.vignette(ctx, width, height, 0.5);
    drawUtils.radialGlow(ctx, 0, 0, width * 0.8, color1, 0.05 * p);
  },
  initParams: () => ({
    speed: 1,
    density: 18,
    color1: '#ff00cc',
    color2: '#00f0ff',
  }),
};
`;

const bgDataVortexTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const dataVortexTemplate: TemplateDefinition = {
  id: 'bg_data_vortex',
  name: '数据漩涡',
  description: '螺旋流动的数据粒子漩涡，前景快速、后景缓慢，营造紧张高速感',
  category: 'effect',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['neon', 'hologram'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'inertiaDecay'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#ff0055' },
    { key: 'speed', label: '旋转速度', type: 'number', default: 1.8, min: 0.5, max: 4, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = params.color || '#00f0ff';
    const accentColor = params.accentColor || '#ff0055';
    const speed = Math.max(0.5, Math.min(4, params.speed ?? 1.8));
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#020205';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 中心发光
    const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.5);
    centerGlow.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    centerGlow.addColorStop(0.5, 'rgba(255, 0, 85, 0.05)');
    centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 漩涡粒子
    ctx.save();
    const arms = 6;
    const particlesPerArm = 30;
    for (let arm = 0; arm < arms; arm++) {
      const baseAngle = (arm / arms) * Math.PI * 2 + time * speed * 0.3;
      for (let i = 0; i < particlesPerArm; i++) {
        const progress = i / particlesPerArm;
        const radius = 80 + progress * width * 0.55;
        const angle = baseAngle + progress * Math.PI * 2 * speed;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const size = 2 + (1 - progress) * 6;
        const alpha = (1 - progress) * 0.8 * p;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = progress > 0.7 ? accentColor : color;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = size * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 拖尾
        ctx.strokeStyle = progress > 0.7 ? accentColor : color;
        ctx.lineWidth = size * 0.4;
        ctx.globalAlpha = alpha * 0.35;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const tailAngle = angle - 0.18 * speed;
        ctx.lineTo(
          Math.cos(tailAngle) * (radius - 20),
          Math.sin(tailAngle) * (radius - 20)
        );
        ctx.stroke();
      }
    }
    ctx.restore();

    // 中心脉冲环
    ctx.save();
    const ringPulse = (time * speed) % 1.5 / 1.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = (1 - ringPulse) * p;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 50 + ringPulse * 180, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
  initParams: () => ({
    color: '#00f0ff',
    accentColor: '#ff0055',
    speed: 1.8,
  }),
};
`;

const bgParticleTunnelTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing, hash } from './templateUtils';

export const particleTunnelTemplate: TemplateDefinition = {
  id: 'bg_particle_tunnel',
  name: '粒子隧道',
  description: '3D 粒子隧道穿越效果，前景粒子快速掠过，中心汇聚产生强烈纵深感',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['neon', 'hologram'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeOutExpo', 'inertiaDecay'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'speed', label: '速度', type: 'number', default: 2, min: 0.5, max: 5, step: 0.1 },
    { key: 'count', label: '粒子数', type: 'number', default: 80, min: 30, max: 200, step: 10 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00f0ff');
    const speed = paramGuard.number(params.speed, 2, 0.5, 5);
    const count = paramGuard.number(params.count, 80, 30, 200);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const fov = 300;

    for (let i = 0; i < count; i++) {
      const seed = i * 7919;
      const angle = hash.float(seed) * Math.PI * 2;
      const radiusBase = 20 + hash.float(seed + 1) * 400;
      const z = ((time * speed * 150 + hash.float(seed + 2) * 3000) % 3000);
      const actualZ = z + 50;
      const scale = fov / actualZ;
      const x = Math.cos(angle + time * 0.2) * radiusBase * scale;
      const y = Math.sin(angle + time * 0.2) * radiusBase * scale * 0.6;
      const size = (1 + hash.float(seed + 3) * 3) * scale;
      const alpha = Math.min(1, scale * 1.5) * p;

      if (size < 0.3) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 3;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 中心汇聚辉光
    drawUtils.radialGlow(ctx, 0, 0, width * 0.4, color, 0.2 * p);
  },
  initParams: () => ({
    color: '#00f0ff',
    speed: 2,
    count: 80,
  }),
};
`;

write('background/matrixRain.ts', bgMatrixRainTs);
write('background/cyberTerminal.ts', bgCyberTerminalTs);
write('background/hologramGrid.ts', bgHologramGridTs);
write('background/neonCity.ts', bgNeonCityTs);
write('background/dataVortex.ts', bgDataVortexTs);
write('background/particleTunnel.ts', bgParticleTunnelTs);

// ========== 6. 特效模板：故障、冲击波、能量场、色差辉光 ==========

const fxScreenGlitchTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing, hash } from './templateUtils';

export const screenGlitchTemplate: TemplateDefinition = {
  id: 'effect_screen_glitch',
  name: '全屏故障',
  description: '全屏 RGB 分离、扫描线与数据块故障，用于高潮或转场冲击',
  category: 'effect',
  quality: 'viral',
  mood: ['tension', 'urgency'],
  material: ['neon', 'carbon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['whipEffect', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '故障强度', type: 'number', default: 0.8, min: 0, max: 1, step: 0.05 },
    { key: 'scanlineCount', label: '扫描线密度', type: 'number', default: 45, min: 10, max: 100, step: 5 },
    { key: 'color', label: '主色调', type: 'color', default: '#ff0055' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const intensity = paramGuard.number(params.intensity, 0.8, 0, 1);
    const scanlineCount = paramGuard.number(params.scanlineCount, 45, 10, 100);
    const color = paramGuard.color(params.color, '#ff0055');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#050505';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 扫描线
    ctx.save();
    ctx.globalAlpha = 0.12 * intensity * p;
    ctx.fillStyle = '#ffffff';
    const lineHeight = height / scanlineCount;
    for (let i = 0; i < scanlineCount; i += 2) {
      const y = -height / 2 + i * lineHeight;
      ctx.fillRect(-width / 2, y, width, lineHeight * 0.6);
    }
    ctx.restore();

    // 随机 glitch 数据块
    const seed = Math.floor(time * 14);
    const blockCount = Math.floor(10 + intensity * 18);
    ctx.save();
    for (let i = 0; i < blockCount; i++) {
      const h = hash.float(seed + i * 13);
      const h2 = hash.float(seed + i * 7);
      const x = -width / 2 + h * width;
      const y = -height / 2 + h2 * height;
      const w = 40 + h * 140 * intensity;
      const hh = 5 + h2 * 24 * intensity;
      const channel = i % 3;
      ctx.fillStyle = channel === 0 ? 'rgba(255,0,80,0.75)' : channel === 1 ? 'rgba(0,240,255,0.65)' : 'rgba(255,255,255,0.55)';
      ctx.fillRect(x, y, w, hh);
    }
    ctx.restore();

    // RGB 分离横条
    ctx.save();
    const stripCount = Math.floor(6 + intensity * 12);
    for (let i = 0; i < stripCount; i++) {
      const h = hash.float(seed + i * 21);
      const y = -height / 2 + h * height;
      const hh = 10 + hash.float(seed + i * 17) * 50 * intensity;
      const shift = (hash.float(seed + i * 31) * 50 - 25) * intensity;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,0,80,0.4)';
      ctx.fillRect(-width / 2 + shift, y, width, hh);
      ctx.fillStyle = 'rgba(0,240,255,0.4)';
      ctx.fillRect(-width / 2 - shift, y, width, hh);
    }
    ctx.restore();

    // 中央高光脉冲
    const pulse = easing.easeOutExpo(1 - Math.abs(p - 0.5) * 2);
    drawUtils.radialGlow(ctx, 0, 0, width * 0.65 * pulse, color, 0.12 * intensity * p);

    // 噪点纹理
    drawUtils.noiseTexture(ctx, -width / 2, -height / 2, width, height, 0.018, time);
  },
  initParams: () => ({
    intensity: 0.8,
    scanlineCount: 45,
    color: '#ff0055',
  }),
};
`;

const fxShockwaveBurstTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const shockwaveBurstTemplate: TemplateDefinition = {
  id: 'effect_shockwave_burst',
  name: '冲击波爆裂',
  description: '多层冲击波从中心爆裂扩散，带弹性衰减与辉光残影',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'urgency'],
  material: ['neon', 'hologram'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['spring', 'dampedOscillation', 'easeOutExpo'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#00f0ff' },
    { key: 'ringCount', label: '环数', type: 'number', default: 5, min: 2, max: 10, step: 1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#00f0ff');
    const ringCount = paramGuard.number(params.ringCount, 5, 2, 10);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const maxR = Math.max(width, height) * 0.75;

    for (let i = 0; i < ringCount; i++) {
      const delay = i * 0.08;
      const localP = Math.max(0, Math.min(1, (p - delay) / (1 - delay)));
      const radius = maxR * easing.easeOutExpo(localP);
      const alpha = (1 - localP) * (0.7 - i * 0.08);
      const lineWidth = 8 * (1 - localP) + 1;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = alpha * p;
      ctx.shadowColor = color;
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 中心核心辉光
    drawUtils.radialGlow(ctx, 0, 0, width * 0.35, color, 0.5 * p);
  },
  initParams: () => ({
    color: '#00f0ff',
    ringCount: 5,
  }),
};
`;

const fxEnergyFieldTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

export const energyFieldTemplate: TemplateDefinition = {
  id: 'effect_energy_field',
  name: '能量场',
  description: '脉动能量场，带等离子体波纹、焦散光斑与电磁干扰',
  category: 'effect',
  quality: 'viral',
  mood: ['mysterious', 'excitement'],
  material: ['hologram', 'neon'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['dampedOscillation', 'pulse'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#7b2ff7' },
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00f0ff' },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = paramGuard.color(params.color, '#7b2ff7');
    const accentColor = paramGuard.color(params.accentColor, '#00f0ff');
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#030008';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const rings = 8;
    for (let i = 0; i < rings; i++) {
      const phase = time * 0.8 + i * 0.7;
      const radius = 80 + i * 65 + Math.sin(phase) * 20;
      const alpha = (0.4 - i * 0.04) * p;
      ctx.save();
      ctx.strokeStyle = i % 2 === 0 ? color : accentColor;
      ctx.lineWidth = 2 + Math.sin(phase) * 1;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 焦散光斑
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.3;
      const r = 120 + Math.sin(time + i) * 60;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      drawUtils.particle(ctx, x, y, 8 + Math.sin(time * 2 + i) * 3, accentColor, 0.5 * p, 0.7);
    }

    drawUtils.vignette(ctx, width, height, 0.45);
  },
  initParams: () => ({
    color: '#7b2ff7',
    accentColor: '#00f0ff',
  }),
};
`;

const fxChromaticGlowTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, easing } from './templateUtils';

export const chromaticGlowTemplate: TemplateDefinition = {
  id: 'effect_chromatic_glow',
  name: 'RGB 色差辉光',
  description: '中心放射 RGB 色差光晕，模拟镜头光学色散与霓虹漏光',
  category: 'effect',
  quality: 'viral',
  mood: ['excitement', 'mysterious'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['easeOutExpo', 'dampedOscillation'],
  schema: [
    { key: 'intensity', label: '强度', type: 'number', default: 0.7, min: 0, max: 1, step: 0.05 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const intensity = paramGuard.number(params.intensity, 0.7, 0, 1);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const pulse = 1 + Math.sin(time * 3) * 0.1;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 红色通道
    const rGrad = ctx.createRadialGradient(-30 * intensity, 0, 0, 0, 0, width * 0.6 * pulse);
    rGrad.addColorStop(0, 'rgba(255, 0, 80, 0)');
    rGrad.addColorStop(0.5, \`rgba(255, 0, 80, \${0.35 * intensity * p})\`);
    rGrad.addColorStop(1, 'rgba(255, 0, 80, 0)');
    ctx.fillStyle = rGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 绿色通道
    const gGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, width * 0.55 * pulse);
    gGrad.addColorStop(0, 'rgba(0, 255, 157, 0)');
    gGrad.addColorStop(0.5, \`rgba(0, 255, 157, \${0.25 * intensity * p})\`);
    gGrad.addColorStop(1, 'rgba(0, 255, 157, 0)');
    ctx.fillStyle = gGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 蓝色通道
    const bGrad = ctx.createRadialGradient(30 * intensity, 0, 0, 0, 0, width * 0.65 * pulse);
    bGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    bGrad.addColorStop(0.5, \`rgba(0, 240, 255, \${0.35 * intensity * p})\`);
    bGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = bGrad;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    ctx.restore();

    // 水平光晕带
    const beamAlpha = 0.15 * intensity * p;
    ctx.fillStyle = \`rgba(255, 255, 255, \${beamAlpha})\`;
    ctx.fillRect(-width / 2, -height / 12, width, height / 6);
  },
  initParams: () => ({
    intensity: 0.7,
  }),
};
`;

const fxNeonScanlinesTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, easing } from './templateUtils';

export const neonScanlinesTemplate: TemplateDefinition = {
  id: 'effect_neon_scanlines',
  name: '霓虹扫描线',
  description: '霓虹灯管式水平扫描线，带 RGB 色差和故障条纹',
  category: 'effect',
  quality: 'viral',
  mood: ['tension', 'mysterious'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['perlinNoise1D'],
  schema: [
    { key: 'color', label: '主色', type: 'color', default: '#ff00a0' },
    { key: 'secondaryColor', label: '辅色', type: 'color', default: '#00f0ff' },
    { key: 'density', label: '密度', type: 'number', default: 26, min: 8, max: 60, step: 2 },
    { key: 'speed', label: '速度', type: 'number', default: 1.4, min: 0.2, max: 3, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const color = params.color || '#ff00a0';
    const secondaryColor = params.secondaryColor || '#00f0ff';
    const density = Math.max(8, Math.min(60, params.density ?? 26));
    const speed = Math.max(0.2, Math.min(3, params.speed ?? 1.4));
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#050008';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const lineHeight = height / density;
    const offset = (time * speed * lineHeight) % lineHeight;

    ctx.save();
    for (let i = -1; i <= density + 1; i++) {
      const y = -height / 2 + i * lineHeight + offset;
      const progress = i / density;
      const alpha = (0.12 + 0.45 * Math.abs(Math.sin(progress * Math.PI + time * speed))) * p;
      const lineColor = progress > 0.5 ? color : secondaryColor;

      ctx.strokeStyle = lineColor;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-width / 2, y);
      ctx.lineTo(width / 2, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // 故障垂直条纹
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const seed = i * 791;
      const x = ((seed * 47 + time * 35) % width) - width / 2;
      const w = 20 + (seed % 50);
      const shift = Math.sin(time * 8 + i) * 10;
      ctx.globalAlpha = (0.08 + 0.1 * Math.random()) * p;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,255,0.3)';
      ctx.fillRect(x + shift, -height / 2, w, height);
    }
    ctx.restore();
  },
  initParams: () => ({
    color: '#ff00a0',
    secondaryColor: '#00f0ff',
    density: 26,
    speed: 1.4,
  }),
};
`;

write('effect/screenGlitch.ts', fxScreenGlitchTs);
write('effect/shockwaveBurst.ts', fxShockwaveBurstTs);
write('effect/energyField.ts', fxEnergyFieldTs);
write('effect/chromaticGlow.ts', fxChromaticGlowTs);
write('effect/neonScanlines.ts', fxNeonScanlinesTs);

// ========== 7. 代码模板：终端日志、代码执行 ==========

const codeTerminalLogTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing, hash } from './templateUtils';

export const terminalLogTemplate: TemplateDefinition = {
  id: 'code_terminal_log',
  name: '终端日志流',
  description: '终端风格日志流，带滚动动画、颜色标签与光标',
  category: 'code',
  quality: 'viral',
  mood: ['mysterious', 'tension'],
  material: ['neon', 'glass'],
  dimensions: { materialOptics: true, physicsMotion: true, spatialDepth: true, styleEmotion: true },
  physics: ['inertiaDecay'],
  schema: [
    { key: 'accentColor', label: '强调色', type: 'color', default: '#00ff9d' },
    { key: 'speed', label: '滚动速度', type: 'number', default: 1.2, min: 0.2, max: 3, step: 0.1 },
  ],
  render: (context: TemplateRenderContext) => {
    const { ctx, width, height, progress, time, params } = context;
    const accentColor = paramGuard.color(params.accentColor, '#00ff9d');
    const speed = paramGuard.number(params.speed, 1.2, 0.2, 3);
    const p = paramGuard.number(progress, 0, 0, 1);

    ctx.fillStyle = '#050a08';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const logs = [
      { type: 'info', text: '[INFO] 模型加载完成' },
      { type: 'success', text: '[OK] 收益流优化成功' },
      { type: 'warn', text: '[WARN] 传统路径效率低于阈值' },
      { type: 'success', text: '[OK] AI 杠杆系数 x17.3' },
      { type: 'info', text: '[INFO] 账户状态: 独立' },
      { type: 'success', text: '[OK] 到账 ¥52,000.00' },
    ];

    ctx.save();
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    const lineHeight = 36;
    const offset = (time * speed * 40) % lineHeight;

    for (let i = 0; i < 16; i++) {
      const y = -height / 2 + 60 + i * lineHeight - offset;
      if (y < -height / 2 || y > height / 2) continue;
      const log = logs[(i + Math.floor(time * speed)) % logs.length];
      const alpha = (0.5 + 0.45 * (1 - Math.abs(y) / (height / 2))) * p;
      ctx.fillStyle = log.type === 'success' ? accentColor : log.type === 'warn' ? '#ffd000' : '#00f0ff';
      ctx.globalAlpha = alpha;
      ctx.fillText(log.text, -width / 2 + 60, y);
    }
    ctx.restore();

    // 光标
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = Math.floor(time * 10) % 2 === 0 ? p : 0;
    ctx.fillRect(-width / 2 + 60, height / 2 - 50, 12, 24);
    ctx.globalAlpha = 1;

    drawUtils.scanlines(ctx, width, height, 4, 0.08);
  },
  initParams: () => ({
    accentColor: '#00ff9d',
    speed: 1.2,
  }),
};
`;

const codeExecutionTs = `import { TemplateDefinition, TemplateRenderContext } from './types';
import { paramGuard, drawUtils, easing } from './templateUtils';

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
`;

write('code/terminalLog.ts', codeTerminalLogTs);
write('code/codeExecution.ts', codeExecutionTs);

// ========== 8. 生成新的 index.ts ==========
const indexTs = `import { TemplateDefinition, TemplateCategory } from './types';

// Text 文字效果模板
import { viralHookTemplate } from './text/viralHook';
import { kineticTitleTemplate } from './text/kineticTitle';
import { glitchTitleTemplate } from './text/glitchTitle';
import { neonScrambleTemplate } from './text/neonScramble';
import { countUpFireTemplate } from './text/countUpFire';
import { cyberSubtitleTemplate } from './text/cyberSubtitle';

// UI 组件模板
import { glassCardTemplate } from './ui/glassCard';
import { metalButtonTemplate } from './ui/metalButton';
import { hologramFrameTemplate } from './ui/hologramFrame';
import { carbonPanelTemplate } from './ui/carbonPanel';

// Background 背景效果模板
import { matrixRainTemplate } from './background/matrixRain';
import { cyberTerminalTemplate } from './background/cyberTerminal';
import { hologramGridTemplate } from './background/hologramGrid';
import { neonCityTemplate } from './background/neonCity';
import { dataVortexTemplate } from './background/dataVortex';
import { particleTunnelTemplate } from './background/particleTunnel';

// Effect 视觉特效模板
import { screenGlitchTemplate } from './effect/screenGlitch';
import { shockwaveBurstTemplate } from './effect/shockwaveBurst';
import { energyFieldTemplate } from './effect/energyField';
import { chromaticGlowTemplate } from './effect/chromaticGlow';
import { neonScanlinesTemplate } from './effect/neonScanlines';

// Code 代码相关模板
import { codeExecutionTemplate } from './code/codeExecution';
import { terminalLogTemplate } from './code/terminalLog';

// 导出所有模板
export {
  viralHookTemplate,
  kineticTitleTemplate,
  glitchTitleTemplate,
  neonScrambleTemplate,
  countUpFireTemplate,
  cyberSubtitleTemplate,
  glassCardTemplate,
  metalButtonTemplate,
  hologramFrameTemplate,
  carbonPanelTemplate,
  matrixRainTemplate,
  cyberTerminalTemplate,
  hologramGridTemplate,
  neonCityTemplate,
  dataVortexTemplate,
  particleTunnelTemplate,
  screenGlitchTemplate,
  shockwaveBurstTemplate,
  energyFieldTemplate,
  chromaticGlowTemplate,
  neonScanlinesTemplate,
  codeExecutionTemplate,
  terminalLogTemplate,
};

// 模板注册表
const TEMPLATES: Record<string, TemplateDefinition> = {};

export const registerTemplate = (template: TemplateDefinition): void => {
  if (!template.id || !template.name || typeof template.render !== 'function') {
    throw new Error('Invalid template format: must have id, name, and render function');
  }
  TEMPLATES[template.id] = template;
  console.log(\`✅ Template registered: \${template.name} (\${template.id})\`);
};

export const getTemplate = (id: string): TemplateDefinition | undefined => {
  return TEMPLATES[id];
};

export const getAllTemplates = (): TemplateDefinition[] => {
  return Object.values(TEMPLATES);
};

export const getTemplatesByCategory = (category: TemplateCategory): TemplateDefinition[] => {
  return Object.values(TEMPLATES).filter(t => t.category === category);
};

export const getTemplateCategories = (): { key: TemplateCategory; name: string }[] => {
  return [
    { key: 'ui', name: 'UI 元素' },
    { key: 'code', name: '代码效果' },
    { key: 'text', name: '文字效果' },
    { key: 'effect', name: '视觉特效' },
    { key: 'other', name: '其他' }
  ];
};

export const hasTemplate = (id: string): boolean => {
  return id in TEMPLATES;
};

export const getTemplateDefaultParams = (templateId: string): Record<string, any> => {
  const template = TEMPLATES[templateId];
  if (!template) return {};
  const defaults: Record<string, any> = {};
  template.schema.forEach(param => {
    defaults[param.key] = param.default;
  });
  return defaults;
};

export type { TemplateDefinition, TemplateParamSchema, TemplateRenderContext, TemplateCategory } from './types';

export {
  easing,
  adaptiveLayout,
  colorUtils,
  drawUtils,
  animationUtils,
  paramGuard,
  hash,
  TemplateBase
} from './templateUtils';

export {
  validateTemplateCode,
  importTemplateFromCode,
  registerTemplateFromCode,
  exportTemplateToCode,
  getTemplateCodeTemplate
} from './templateImporter';

export { TEMPLATES };

// 注册内置模板
registerTemplate(viralHookTemplate);
registerTemplate(kineticTitleTemplate);
registerTemplate(glitchTitleTemplate);
registerTemplate(neonScrambleTemplate);
registerTemplate(countUpFireTemplate);
registerTemplate(cyberSubtitleTemplate);

registerTemplate(glassCardTemplate);
registerTemplate(metalButtonTemplate);
registerTemplate(hologramFrameTemplate);
registerTemplate(carbonPanelTemplate);

registerTemplate(matrixRainTemplate);
registerTemplate(cyberTerminalTemplate);
registerTemplate(hologramGridTemplate);
registerTemplate(neonCityTemplate);
registerTemplate(dataVortexTemplate);
registerTemplate(particleTunnelTemplate);

registerTemplate(screenGlitchTemplate);
registerTemplate(shockwaveBurstTemplate);
registerTemplate(energyFieldTemplate);
registerTemplate(chromaticGlowTemplate);
registerTemplate(neonScanlinesTemplate);

registerTemplate(codeExecutionTemplate);
registerTemplate(terminalLogTemplate);
`;

write('index.ts', indexTs);

// ========== 9. 更新模块层分类索引 ==========
const categories = {
  text: `export const textTemplates = [
  'text_viral_hook',
  'text_kinetic_title',
  'text_glitch_title',
  'text_neon_scramble',
  'text_countup_fire',
  'text_cyber_subtitle',
];
export default textTemplates;
`,
  ui: `export const uiTemplates = [
  'ui_glass_card',
  'ui_metal_button',
  'ui_hologram_frame',
  'ui_carbon_panel',
];
export default uiTemplates;
`,
  background: `export const backgroundTemplates = [
  'bg_matrix_rain',
  'bg_cyber_terminal',
  'bg_hologram_grid',
  'bg_neon_city',
  'bg_data_vortex',
  'bg_particle_tunnel',
];
export default backgroundTemplates;
`,
  effect: `export const effectTemplates = [
  'effect_screen_glitch',
  'effect_shockwave_burst',
  'effect_energy_field',
  'effect_chromatic_glow',
  'effect_neon_scanlines',
];
export default effectTemplates;
`,
  transition: `// 转场模板已移除：系统性重写后，非病毒式转场效果不再提供
export const transitionTemplates: string[] = [];
export default transitionTemplates;
`,
};

Object.entries(categories).forEach(([cat, content]) => {
  const filePath = path.join(moduleTemplateDir, cat, 'index.ts');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('📦 src/modules/template/categories/' + cat + '/index.ts');
});

console.log('\\n🎉 模板系统性重写完成！');
