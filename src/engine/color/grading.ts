// 调色管线：将 ColorGrading 参数编译为可叠加的 CSS 表现
// 曝光/对比/饱和/色相走 filter；色温/色调走 soft-light 混合层；褪色走 lighten 灰层抬黑位
import type { ColorGrading } from '../../types/core';

export interface GradingOverlay {
  /** 覆盖层颜色（完整 rgb()/rgba() 形式） */
  color: string;
  /** CSS mix-blend-mode */
  blend: 'soft-light' | 'lighten';
  /** 层透明度，默认 1 */
  opacity?: number;
}

export interface GradingResult {
  /** 追加在基础 filter 前的 CSS 片段，中性时为空串 */
  filter: string;
  /** 需要渲染的混合覆盖层（按数组顺序叠放） */
  overlays: GradingOverlay[];
  enabled: boolean;
}

type RGB = [number, number, number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerpRGB = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** 参数是否全部中性，用于零开销跳过 */
export function isGradingNeutral(g?: ColorGrading): boolean {
  if (!g) return true;
  return (
    !g.exposure && !g.contrast && !g.saturation &&
    !g.temperature && !g.tint && !g.hueRotate && !g.fade
  );
}

export function buildGradingCss(g?: ColorGrading): GradingResult {
  if (isGradingNeutral(g)) return { filter: '', overlays: [], enabled: false };
  const c = g!;

  // ---- filter ----
  const parts: string[] = [];
  if (c.exposure) parts.push(`brightness(${clamp(1 + c.exposure * 0.6, 0.2, 2.2).toFixed(3)})`);
  if (c.contrast) parts.push(`contrast(${clamp(1 + c.contrast * 0.6, 0.3, 2).toFixed(3)})`);
  if (c.saturation) parts.push(`saturate(${clamp(1 + c.saturation, 0, 2).toFixed(3)})`);
  if (c.hueRotate) parts.push(`hue-rotate(${clamp(c.hueRotate, -180, 180).toFixed(1)}deg)`);

  // ---- 混合层 ----
  const overlays: GradingOverlay[] = [];

  // 褪色：中性灰 lighten 抬升黑位
  if ((c.fade ?? 0) > 0.001) {
    overlays.push({
      color: `rgba(132,132,132,${clamp(c.fade!, 0, 1) * 0.30})`,
      blend: 'lighten',
    });
  }

  // 色温/色调：白基色合成偏色后以 soft-light 叠加，强度控制层不透明度
  const tempAmt = clamp((c.temperature ?? 0) / 100, -1, 1);
  const tintAmt = clamp((c.tint ?? 0) / 100, -1, 1);
  const tintStrength = Math.max(Math.abs(tempAmt), Math.abs(tintAmt));
  if (tintStrength > 0.001) {
    let rgb: RGB = [255, 255, 255];
    if (tempAmt !== 0) {
      const target: RGB = tempAmt > 0 ? [255, 138, 40] : [52, 138, 255];
      rgb = lerpRGB(rgb, target, Math.abs(tempAmt));
    }
    if (tintAmt !== 0) {
      const target: RGB = tintAmt > 0 ? [244, 66, 181] : [98, 235, 108];
      rgb = lerpRGB(rgb, target, Math.abs(tintAmt) * 0.7);
    }
    overlays.push({
      color: `rgb(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])})`,
      blend: 'soft-light',
      opacity: clamp(tintStrength, 0, 1),
    });
  }

  return { filter: parts.join(' '), overlays, enabled: true };
}

// ==================== 一键风格预设 ====================
export interface GradingLookPreset {
  id: string;
  name: string;
  params: ColorGrading;
}

export const GRADING_LOOKS: GradingLookPreset[] = [
  { id: 'none', name: '原始', params: {} },
  { id: 'teal_orange', name: '影视青橙', params: { temperature: 38, tint: -12, contrast: 14, saturation: 16, hueRotate: -4 } },
  { id: 'film_faded', name: '胶片褪色', params: { fade: 0.5, contrast: -8, saturation: -18, temperature: 8 } },
  { id: 'jp_fresh', name: '日系清新', params: { temperature: -14, exposure: 8, saturation: 10, fade: 0.18 } },
  { id: 'noir', name: '经典黑白', params: { saturation: -100, contrast: 22 } },
  { id: 'cyber_blue', name: '赛博冷蓝', params: { temperature: -46, hueRotate: -10, contrast: 16, saturation: 22 } },
  { id: 'golden_hour', name: '黄昏金调', params: { temperature: 52, exposure: 5, saturation: 12 } },
  { id: 'vintage_retro', name: '复古怀旧', params: { temperature: 24, tint: 16, fade: 0.32, saturation: -10, contrast: -5 } },
];
