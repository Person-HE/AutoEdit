import {
  instantSpeed,
  sourceElapsed,
  maxProjectDurationForSource,
  normalizePoints,
  curveAverage,
  hasSpeedCurve,
} from '../engine/timing/speedCurve';
import { buildGradingCss, isGradingNeutral } from '../engine/color/grading';
import { composeTransformCss } from '../engine/spatial/compose';
import type { Clip, SpeedPoint } from '../types/core';

const pts = (arr: Array<[number, number]>): SpeedPoint[] => arr.map(([t, value]) => ({ t, value }));

function clip(partial: Partial<Clip>): Clip {
  return {
    id: 'c1', assetId: 'a', trackId: 't', type: 'video',
    startTime: 0, duration: 10, offset: 0,
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    style: { opacity: 1, zIndex: 0 }, effects: [], name: 'c',
    ...partial,
  };
}

describe('曲线变速', () => {
  it('normalizePoints 排序/钳制/淘汰单点', () => {
    expect(normalizePoints([{ t: 1, value: 3 }, { t: 0, value: 9 }])).toEqual([
      { t: 0, value: 5 },
      { t: 1, value: 3 },
    ]);
    expect(normalizePoints([{ t: 0.2, value: 2 }])).toBeNull();
    expect(normalizePoints(undefined)).toBeNull();
  });

  it('瞬时速度分段线性插值与端点钳制', () => {
    const p = pts([[0, 1], [0.5, 0.25], [1, 2]]);
    expect(instantSpeed(p, -0.1, 1)).toBe(1);
    expect(instantSpeed(p, 1.2, 1)).toBe(2);
    expect(instantSpeed(p, 0.25, 1)).toBeCloseTo(0.625);
    expect(instantSpeed(null, 0.4, 3)).toBe(3); // 无曲线回退恒速
  });

  it('sourceElapsed 恒速与曲线一致性', () => {
    // 曲线全程 1× 等价于 speed=1 线性
    const flat = clip({ duration: 8, offset: 2, speed: 1, speedCurve: [{ t: 0, value: 1 }, { t: 1, value: 1 }] });
    const linear = clip({ duration: 8, offset: 2, speed: 1 });
    for (const rel of [0, 2, 5.5, 8]) {
      expect(sourceElapsed(flat, rel)).toBeCloseTo(sourceElapsed(linear, rel), 6);
    }
  });

  it('曲线积分面积正确（三角速度块）', () => {
    // 0→0.5 均 1（面积0.5），0.5→1 从1线性到3（梯形均值2，面积1）→ 总积分1.5
    const c = clip({ duration: 4, offset: 0, speedCurve: [{ t: 0, value: 1 }, { t: 0.5, value: 1 }, { t: 1, value: 3 }] });
    expect(sourceElapsed(c, 2)).toBeCloseTo(2, 6);      // rel=2s → u=0.5
    expect(sourceElapsed(c, 4)).toBeCloseTo(1.5 * 4, 6); // 全程 = 6s 源消耗
  });

  it('maxProjectDurationForSource 反解可用源预算', () => {
    const linear = clip({ duration: 10, offset: 0, speed: 2 });
    expect(maxProjectDurationForSource(linear, 10)).toBeCloseTo(5, 4);

    const curved = clip({ duration: 10, offset: 0, speedCurve: [{ t: 0, value: 2 }, { t: 1, value: 2 }] });
    expect(maxProjectDurationForSource(curved, 10)).toBeCloseTo(5, 2);

    // offset 占用预算
    const withOffset = clip({ duration: 10, offset: 3, speed: 1 });
    expect(maxProjectDurationForSource(withOffset, 13)).toBeCloseTo(10, 4);
  });

  it('curveAverage / hasSpeedCurve', () => {
    expect(curveAverage(pts([[0, 1], [1, 3]]))).toBeCloseTo(2, 6);
    expect(hasSpeedCurve(clip({}))).toBe(false);
    expect(hasSpeedCurve(clip({ speedCurve: pts([[0, 1], [1, 2]]) }))).toBe(true);
  });
});

describe('调色编译', () => {
  it('空参数中性零开销', () => {
    expect(isGradingNeutral(undefined)).toBe(true);
    const r = buildGradingCss({});
    expect(r.enabled).toBe(false);
    expect(r.filter).toBe('');
    expect(r.overlays).toHaveLength(0);
  });

  it('filter 分量按参数生成且饱和度 -1 为黑白', () => {
    const r = buildGradingCss({ exposure: 0.5, contrast: -0.2, saturation: -1 });
    expect(r.filter).toContain('brightness(1.300)');
    expect(r.filter).toContain('contrast(0.880)');
    expect(r.filter).toContain('saturate(0.000)');
  });

  it('色温产出 soft-light 层、褪色产出 lighten 层', () => {
    const warm = buildGradingCss({ temperature: 60 });
    expect(warm.overlays.some(o => o.blend === 'soft-light' && o.color.startsWith('rgb('))).toBe(true);

    const faded = buildGradingCss({ fade: 0.5 });
    const lighten = faded.overlays.find(o => o.blend === 'lighten');
    expect(lighten).toBeTruthy();
    expect(lighten!.color).toMatch(/rgba\(132,132,132,/);
  });
});

describe('空间合成', () => {
  it('仅基础字段时不产生 3D 片段', () => {
    const css = composeTransformCss({ x: 10, y: -5, scale: 2 });
    expect(css).not.toContain('rotateX');
    expect(css).not.toContain('translateZ');
    expect(css).toContain('translate3d(10px, -5px, 0px)');
    expect(css).toContain('scale(2)');
  });

  it('3D 与斜切字段全部进入合成', () => {
    const css = composeTransformCss({
      x: 0, y: 0, scale: 1, depthZ: 120, rotateX: 30, rotateY: -45, skewX: 8,
    });
    // 深度经 translate3d 第三分量生效
    expect(css).toContain('translate3d(0px, 0px, 120px)');
    expect(css).toContain('rotateX(30.00deg)');
    expect(css).toContain('rotateY(-45.00deg)');
    expect(css).toContain('skewX(8.00deg)');
  });
});
