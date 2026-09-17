// 关键帧求值器：给定片段与片内相对时间，计算各通道插值结果
// 约定：缓动类型记录在"左"关键帧上（该段的出场曲线）；hold 表示保持左侧值
import type { Clip, Keyframe, KeyframeChannel } from '../../types/core';
import { easeInOutQuad } from '../utils/easing';

export type EasedValue = Partial<Record<KeyframeChannel, number>>;

function ease(kind: Keyframe['easing'], t: number): number {
  switch (kind) {
    case 'linear': return t;
    case 'ease_in': return t * t;
    case 'ease_out': return t * (2 - t);
    case 'ease_in_out': return easeInOutQuad(t);
    case 'hold': return 0;
    default: return t;
  }
}

/** 对单通道求值：返回 undefined 表示该通道无关键帧控制（调用方回退到静态值） */
export function evaluateChannel(frames: Keyframe[] | undefined, relTime: number): number | undefined {
  if (!frames || frames.length === 0) return undefined;
  if (frames.length === 1) return frames[0].value;

  // 关键帧须按时间有序；防御性排序副本仅在乱序时生成
  let framesSorted = frames;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i - 1].time > frames[i].time) {
      framesSorted = [...frames].sort((a, b) => a.time - b.time);
      break;
    }
  }

  if (relTime <= framesSorted[0].time) return framesSorted[0].value;
  const last = framesSorted[framesSorted.length - 1];
  if (relTime >= last.time) return last.value;

  // 二分定位区间 [i-1, i]
  let lo = 0, hi = framesSorted.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (framesSorted[mid].time <= relTime) lo = mid; else hi = mid;
  }
  const a = framesSorted[lo];
  const b = framesSorted[hi];
  if (a.easing === 'hold') return a.value;

  const span = b.time - a.time;
  const tRaw = span <= 1e-6 ? 1 : (relTime - a.time) / span;
  const t = ease(a.easing, Math.min(1, Math.max(0, tRaw)));
  return a.value + (b.value - a.value) * t;
}

/**
 * 计算某时刻全部关键帧通道的值。
 * transformKeyframes 与 styleOpacity 由调用方合并进基础变换/不透明度。
 */
export function evaluateClipKeyframes(clip: Clip, relTime: number): Required<EasedValue> {
  const kf = clip.keyframes || {};
  const evalOr = (frames: Keyframe[] | undefined, fb: number) => evaluateChannel(frames, relTime) ?? fb;
  return {
    x: evalOr(kf.x, clip.transform?.x ?? 0),
    y: evalOr(kf.y, clip.transform?.y ?? 0),
    scale: evalOr(kf.scale, clip.transform?.scale ?? 1),
    rotation: evalOr(kf.rotation, clip.transform?.rotation ?? 0),
    opacity: evalOr(kf.opacity, 1),
    z: evalOr(kf.z, clip.transform?.depthZ ?? 0),
    rotateX: evalOr(kf.rotateX, clip.transform?.rotateX ?? 0),
    rotateY: evalOr(kf.rotateY, clip.transform?.rotateY ?? 0),
  };
}
