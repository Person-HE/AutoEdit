// 曲线变速时序引擎（纯函数）
// 模型：clip.speedCurve = 控制点数组 {t(片段进度 0..1), value(瞬时速度倍率)}
// 时间线窗口时长保持不变，源媒体消耗 = clip.offset + ∫₀^rel s(dt)·dt。
import type { Clip, SpeedPoint } from '../../types/core';

export const SPEED_MIN = 0.1;
export const SPEED_MAX = 5;

export const clampSpeed = (v: number): number => Math.min(SPEED_MAX, Math.max(SPEED_MIN, v));

/** 归一化：钳制范围、按 t 升序去重；空/单点视为无曲线 */
export function normalizePoints(points?: SpeedPoint[]): SpeedPoint[] | null {
  if (!points || points.length === 0) return null;
  const sorted = points
    .map(p => ({ t: clamp01(p.t), value: clampSpeed(p.value) }))
    .sort((a, b) => a.t - b.t);
  return sorted.length >= 2 ? sorted : null;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** 片段是否有生效的变速曲线 */
export function hasSpeedCurve(clip?: Pick<Clip, 'speedCurve'> | null): boolean {
  return !!normalizePoints(clip?.speedCurve);
}

/**
 * 瞬时速度：分段线性插值，端点外钳到最近控制点。
 * 无曲线时返回恒速 fallbackBase。
 */
export function instantSpeed(points: SpeedPoint[] | null | undefined, fraction: number, fallbackBase: number): number {
  const pts = normalizePoints(points);
  if (!pts) return fallbackBase;

  const u = clamp01(fraction);
  if (u <= pts[0].t) return pts[0].value;
  const last = pts[pts.length - 1];
  if (u >= last.t) return last.value;

  let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].t <= u) lo = mid; else hi = mid;
  }
  const a = pts[lo], b = pts[hi];
  if (b.t <= a.t + 1e-9) return b.value;
  const k = (u - a.t) / (b.t - a.t);
  return a.value + (b.value - a.value) * k;
}

function integrateNormalized(pts: SpeedPoint[], uLimit: number): number {
  let sum = 0;
  for (let i = 0; i < pts.length - 1 && pts[i].t < uLimit; i++) {
    const segEndU = Math.min(uLimit, pts[i + 1].t);
    const span = segEndU - pts[i].t;
    if (span <= 0) continue;
    sum += ((instantSpeed(pts, pts[i].t, 1) + instantSpeed(pts, segEndU, 1)) / 2) * span;
  }
  return sum;
}

/** 源媒体已消耗秒数：offset + ∫₀^rel s dt（解析分段积分） */
export function sourceElapsed(clip: Clip, projectRelSeconds: number): number {
  const offset = clip.offset ?? 0;
  const dur = Math.max(1e-6, clip.duration);
  const rel = clamp01(Math.max(projectRelSeconds, 0) / dur) * dur;

  const pts = normalizePoints(clip.speedCurve);
  if (!pts) {
    const speed = clampSpeed(clip.speed ?? 1);
    return offset + rel * speed;
  }
  return offset + integrateNormalized(pts, rel / dur) * dur;
}

/** 整段归一积分（进度 0..1 全程速度均值） */
export function curveAverage(points: SpeedPoint[]): number {
  const pts = normalizePoints(points);
  return pts ? integrateNormalized(pts, 1) : 1;
}

/**
 * 给定可用源时长求时间线允许的最大窗口秒数（修剪右边缘钳制）：
 * 最大 D 使 sourceElapsed(offset, D) ≤ available。
 */
export function maxProjectDurationForSource(
  base: { offset?: number; speed?: number; speedCurve?: SpeedPoint[] },
  availableSourceSeconds: number
): number {
  const offset = base.offset ?? 0;
  const budget = Math.max(0, availableSourceSeconds - offset);

  const pts = normalizePoints(base.speedCurve);
  if (!pts) {
    return budget / clampSpeed(base.speed ?? 1);
  }

  let lo = 0, hi = 36000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (integrateNormalized(pts, 1) * mid <= budget) lo = mid; else hi = mid;
  }
  return lo;
}

// ==================== 一键节奏预设 ====================
export interface SpeedCurvePreset {
  id: string;
  name: string;
  /** [t, value] 简写形式 */
  points: Array<[number, number]>;
}

export const SPEED_CURVE_PRESETS: SpeedCurvePreset[] = [
  { id: 'standard', name: '常规', points: [[0, 1], [1, 1]] },
  { id: 'hero', name: '英雄时刻', points: [[0, 2.5], [0.32, 2.5], [0.52, 0.28], [0.72, 0.28], [1, 2.5]] },
  { id: 'bullet', name: '子弹时间', points: [[0, 2.2], [0.36, 2.2], [0.5, 0.15], [0.64, 1.6], [1, 1]] },
  { id: 'montage', name: '蒙太奇', points: [[0, 1.8], [0.3, 0.4], [0.7, 1.8], [1, 0.5]] },
  { id: 'ramp_in', name: '冲刺收尾', points: [[0, 1], [0.55, 1], [1, 3.5]] },
  { id: 'freeze_end', name: '结尾缓停', points: [[0, 1], [0.65, 1], [0.85, 0.35], [1, 0.12]] },
];

export function presetToPoints(preset: SpeedCurvePreset): SpeedPoint[] {
  return preset.points.map(([t, value]) => ({ t, value }));
}
