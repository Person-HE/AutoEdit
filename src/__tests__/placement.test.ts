import {
  resolvePlacement,
  applySnap,
  snapScalar,
  getTrimLimits,
  clampTrimStart,
  clampTrimEnd,
  buildBusyIntervals,
} from '../modules/timeline/placement';
import type { Clip } from '../types/core';

function clip(id: string, start: number, dur: number): Clip {
  return {
    id,
    assetId: 'a',
    trackId: 't1',
    type: 'video',
    startTime: start,
    duration: dur,
    offset: 0,
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    style: { opacity: 1, zIndex: 0 },
    effects: [],
    name: id,
  };
}

describe('resolvePlacement 同轨防重叠让位', () => {
  it('空轨道直接返回期望位置', () => {
    expect(resolvePlacement([], 2, 5)).toBe(5);
  });

  it('无冲突时原样返回', () => {
    const clips = [clip('a', 0, 2)];
    expect(resolvePlacement(clips, 2, 3)).toBe(3);
  });

  it('与片段重叠时向右让位到其结束点', () => {
    const clips = [clip('a', 0, 4)];
    expect(resolvePlacement(clips, 2, 3)).toBe(4);
  });

  it('靠近左边缘时向左让位', () => {
    const clips = [clip('a', 4, 4)];
    expect(resolvePlacement(clips, 2, 3)).toBe(2);
  });

  it('选择距离最近的空隙', () => {
    const clips = [clip('a', 0, 4), clip('b', 10, 4)];
    // 落在 a 尾部(4)与 b 头部(10)之间空隙
    expect(resolvePlacement(clips, 2, 6)).toBe(6);
    // wanted=9 与 b 冲突：左侧可放 start=8(dist1)，右侧从 12? b 尾=14(dist5) → 选 8
    expect(resolvePlacement(clips, 2, 9)).toBe(8);
  });

  it('持续为后面保留无限空间', () => {
    const clips = [clip('a', 0, 100)];
    expect(resolvePlacement(clips, 50, 10)).toBe(100);
  });

  it('buildBusyIntervals 合并重叠脏数据', () => {
    const busy = buildBusyIntervals([clip('a', 0, 4), clip('b', 2, 6), clip('c', 20, 1)]);
    expect(busy).toHaveLength(2);
    expect(busy[0]).toMatchObject({ start: 0, end: 8 });
    expect(busy[1]).toMatchObject({ start: 20, end: 21 });
  });
});

describe('applySnap 磁吸吸附', () => {
  const points = [0, 5, 10];

  it('起点在阈值内吸附', () => {
    const r = applySnap(5.2, 2, points, 0.3);
    expect(r.start).toBe(5);
    expect(r.snapLines).toEqual([5]);
  });

  it('终点命中时按终点回推起点', () => {
    const r = applySnap(7.85, 3, points, 0.3); // end=10.85? no: 7.85+3=10.85 不吸附
    // 修正用例：end 恰好接近 10
    const r2 = applySnap(6.85, 3, points, 0.3); // end=9.85 近 10
    expect(r2.start).toBeCloseTo(7, 5);
  });

  it('两端同时接近取更近者', () => {
    // start=4.88 距5差0.12；end=6.92+... 保持 start 更近
    const r = applySnap(4.88, 2, points, 0.15);
    expect(r.start).toBeCloseTo(5, 5);
  });

  it('超阈值不吸附', () => {
    const r = applySnap(6, 2, points, 0.3);
    expect(r.start).toBe(6);
    expect(r.snapLines).toHaveLength(0);
  });

  it('snapScalar 修剪边缘吸附', () => {
    expect(snapScalar(4.9, points, 0.2).value).toBe(5);
    expect(snapScalar(6, points, 0.2).value).toBe(6);
  });
});

describe('修剪钳制', () => {
  const neighbors = [clip('left', 0, 4), clip('self', 5, 4), clip('right', 12, 4)];

  it('getTrimLimits 取左右邻居边界', () => {
    const limits = getTrimLimits(neighbors, neighbors[1]);
    expect(limits.minStart).toBe(4);
    expect(limits.maxEnd).toBe(12);
  });

  it('clampTrimStart 尊重邻居与最小时长', () => {
    const limits = { minStart: 4, maxEnd: 12 };
    expect(clampTrimStart(2, 9, limits)).toEqual({ start: 4, duration: 5 });
    expect(clampTrimStart(8.99, 9, limits).start).toBeLessThan(9);
  });

  it('clampTrimEnd 不越过右邻居', () => {
    const limits = { minStart: 4, maxEnd: 12 };
    expect(clampTrimEnd(5, 30, limits).duration).toBe(7);
    expect(clampTrimEnd(5, 1, limits).duration).toBeCloseTo(0.1, 5);
  });
});
