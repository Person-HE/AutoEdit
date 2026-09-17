// 时间线布局引擎：同轨防重叠(剪映式吸附+让位) + 磁吸吸附
// 纯函数实现，不依赖 store，便于单测与 AI 工具复用
import type { Clip } from '../../types/core';

export const MIN_CLIP_DURATION = 0.1;

export interface BusyInterval {
  start: number;
  end: number;
  clipId: string;
}

/** 取某轨道的片段并按 startTime 排序，可排除自身 */
export function getSortedTrackClips(
  clips: Record<string, Clip>,
  trackId: string,
  excludeClipId?: string
): Clip[] {
  const result: Clip[] = [];
  for (const id in clips) {
    const clip = clips[id];
    if (clip.trackId !== trackId) continue;
    if (excludeClipId && clip.id === excludeClipId) continue;
    result.push(clip);
  }
  return result.sort((a, b) => a.startTime - b.startTime);
}

/** 将某轨道片段合并为占用区间（相邻不合并） */
export function buildBusyIntervals(trackClips: Clip[]): BusyInterval[] {
  const sorted = [...trackClips].sort((a, b) => a.startTime - b.startTime);
  const busy: BusyInterval[] = [];
  for (const clip of sorted) {
    const start = clip.startTime;
    const end = clip.startTime + clip.duration;
    const last = busy[busy.length - 1];
    if (last && start <= last.end) {
      // 重叠或相接的历史脏数据按一个区间处理
      last.end = Math.max(last.end, end);
    } else {
      busy.push({ start, end, clipId: clip.id });
    }
  }
  return busy;
}

export function rangeIntersectsBusy(start: number, end: number, busy: BusyInterval[]): boolean {
  for (const b of busy) {
    if (start < b.end - 1e-6 && b.start < end - 1e-6) return true;
  }
  return false;
}

/**
 * 剪映式让位：在指定轨道为长度 duration 的片段寻找离 wantedStart 最近的合法落点。
 * 落点保证 [start, start+duration) 与任何已存在片段无交集。找不到返回 null。
 */
export function resolvePlacement(
  trackClips: Clip[],
  duration: number,
  wantedStart: number,
  opts?: { maxDistance?: number }
): number | null {
  if (duration <= 0) return Math.max(0, wantedStart);
  const maxDistance = opts?.maxDistance ?? Infinity;

  const busy = buildBusyIntervals(trackClips);

  if (!rangeIntersectsBusy(wantedStart, wantedStart + duration, busy)) {
    return Math.max(0, wantedStart);
  }

  // 收集所有空闲间隙，选择距离 wantedStart 最近的合法落点
  let best: number | null = null;
  let bestDist = Infinity;

  const gaps: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  for (const b of busy) {
    if (b.start - cursor > 0.0001) gaps.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  gaps.push({ start: cursor, end: Infinity }); // 最后一片段之后的无限空间

  for (const gap of gaps) {
    if (gap.end - gap.start < duration - 1e-6) continue;
    const candidate = Math.min(Math.max(wantedStart, gap.start), gap.end === Infinity ? Infinity : gap.end - duration);
    const dist = Math.abs(candidate - wantedStart);
    if (dist < bestDist && dist <= maxDistance) {
      bestDist = dist;
      best = candidate;
    }
  }

  return best;
}

/**
 * 磁吸吸附：尝试将移动片段的首/尾边缘吸附到候选点上。
 * 返回修正后的 startTime；未命中时原样返回。
 */
export function applySnap(
  wantedStart: number,
  duration: number,
  snapPoints: number[],
  thresholdSecs: number
): { start: number; snapLines: number[] } {
  const edges: Array<{ pos: number; kind: 'start' | 'end' }> = [
    { pos: wantedStart, kind: 'start' },
    { pos: wantedStart + duration, kind: 'end' },
  ];

  let adjusted = wantedStart;
  const lines: number[] = [];
  let bestDist = thresholdSecs;

  for (const edge of edges) {
    for (const point of snapPoints) {
      const dist = Math.abs(edge.pos - point);
      if (dist <= bestDist) {
        bestDist = dist;
        adjusted = edge.kind === 'start' ? point : point - duration;
        lines.length = 0;
        lines.push(point);
      }
    }
  }

  if (adjusted < 0) adjusted = 0;
  return { start: adjusted, snapLines: lines };
}

/** 单值吸附（修剪边缘用）：返回最近候选点或原值 */
export function snapScalar(value: number, snapPoints: number[], thresholdSecs: number): { value: number; snappedPoint?: number } {
  let best: number | undefined;
  let bestDist = thresholdSecs;
  for (const p of snapPoints) {
    const d = Math.abs(p - value);
    if (d <= bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best === undefined ? { value } : { value: best, snappedPoint: best };
}

/** 收集吸附参考点：所有轨道片段首尾 + 播放头 + 时间零点 */
export function buildSnapPoints(
  allClips: Record<string, Clip>,
  excludeClipId?: string,
  playhead?: number
): number[] {
  const points = new Set<number>([0]);
  if (typeof playhead === 'number' && isFinite(playhead)) points.add(playhead);
  for (const id in allClips) {
    if (id === excludeClipId) continue;
    const clip = allClips[id];
    points.add(Math.max(0, clip.startTime));
    points.add(clip.startTime + clip.duration);
  }
  return [...points].sort((a, b) => a - b);
}

export interface TrimLimits {
  /** 左侧允许的最早 startTime（通常是左邻居的结束） */
  minStart: number;
  /** 右侧允许的最晚 endTime（通常是右邻居的开始） */
  maxEnd: number;
  /** 最短保留时长 */
  minDuration?: number;
}

/** 计算修剪左边缘时的钳制值 */
export function clampTrimStart(
  newStart: number,
  currentEnd: number,
  limits: TrimLimits
): { start: number; duration: number } {
  const minDuration = limits.minDuration ?? MIN_CLIP_DURATION;
  const clamped = Math.min(Math.max(newStart, Math.max(0, limits.minStart)), currentEnd - minDuration);
  return { start: clamped, duration: currentEnd - clamped };
}

/** 计算修剪右边缘时的钳制值 */
export function clampTrimEnd(
  currentStart: number,
  newEnd: number,
  limits: TrimLimits
): { duration: number } {
  const minDuration = limits.minDuration ?? MIN_CLIP_DURATION;
  const clampedEnd = Math.max(Math.min(newEnd, limits.maxEnd), currentStart + minDuration);
  return { duration: clampedEnd - currentStart };
}

/** 修剪边界计算：给定同轨邻居数组与当前片段，返回左右可动范围 */
export function getTrimLimits(
  trackClips: Clip[],
  clip: Clip
): TrimLimits {
  let minStart = 0;
  let maxEnd = Infinity;
  const myEnd = clip.startTime + clip.duration;

  for (const other of trackClips) {
    if (other.id === clip.id) continue;
    const otherEnd = other.startTime + other.duration;
    // 左邻居：完全在我左侧、结束不超过我的开始
    if (otherEnd <= clip.startTime + 1e-6) {
      minStart = Math.max(minStart, otherEnd);
    }
    // 右邻居：完全在我右侧
    if (other.startTime >= myEnd - 1e-6) {
      maxEnd = Math.min(maxEnd, other.startTime);
    }
  }

  return { minStart, maxEnd };
}
