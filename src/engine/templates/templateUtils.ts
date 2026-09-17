import { TemplateRenderContext } from './types';
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
      ctx.font = `${fontSize}px Arial`;
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
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },
  toRgba: (color: string, alpha: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },
  withAlpha: (r: number, g: number, b: number, a: number): string => {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
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
    grad.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
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
    grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    grad.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.3})`);
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
