import { evaluateChannel, evaluateClipKeyframes } from '../engine/keyframes/evaluate';
import type { Clip, Keyframe } from '../types/core';

function kf(time: number, value: number, easing: Keyframe['easing'] = 'linear'): Keyframe {
  return { id: `${time}-${value}`, time, value, easing };
}

describe('关键帧求值', () => {
  it('单帧恒定', () => {
    expect(evaluateChannel([kf(1, 5)], 0.5)).toBe(5);
  });

  it('区间外取边界值', () => {
    const frames = [kf(0, 0), kf(2, 10)];
    expect(evaluateChannel(frames, -1)).toBe(0);
    expect(evaluateChannel(frames, 3)).toBe(10);
  });

  it('线性插值', () => {
    const frames = [kf(0, 0), kf(2, 10)];
    expect(evaluateChannel(frames, 1)).toBe(5);
  });

  it('hold 保持左侧值', () => {
    const frames = [kf(0, 4, 'hold'), kf(2, 10)];
    expect(evaluateChannel(frames, 1)).toBe(4);
    expect(evaluateChannel(frames, 2.01)).toBe(10);
  });

  it('ease_in 慢启动', () => {
    const frames = [kf(0, 0, 'ease_in'), kf(2, 10)];
    expect(evaluateChannel(frames, 1)).toBeCloseTo(2.5, 6); // t=0.5 → 0.25*10
  });

  it('多帧二分定位正确', () => {
    const frames = [kf(0, 0), kf(1, 10), kf(3, 20), kf(4, 0)];
    // 段 (1→3s) 斜率 5/s：t=1.5 → 12.5
    expect(evaluateChannel(frames, 1.5)).toBe(12.5);
    // 段 (3→4s)：t=3.5 → 10
    expect(evaluateChannel(frames, 3.5)).toBe(10);
  });

  it('无关键帧返回 undefined', () => {
    expect(evaluateChannel(undefined, 1)).toBeUndefined();
    expect(evaluateChannel([], 1)).toBeUndefined();
  });
});

describe('整段片段求值', () => {
  const clip = {
    transform: { x: 100, y: 50, scale: 2, rotation: 90 },
    style: { opacity: 0.8, zIndex: 0 },
    keyframes: {
      x: [kf(0, 0), kf(1, 200)],
      opacity: [kf(0, 0), kf(1, 1)],
      rotation: [kf(0, 45)],
    },
  } as unknown as Clip;

  it('只覆盖启用的通道并叠加基础不透明度语义', () => {
    const ev = evaluateClipKeyframes(clip, 0.5);
    expect(ev.x).toBe(100);
    expect(ev.opacity).toBe(0.5);
    // 未启用通道回落到静态值
    expect(ev.y).toBe(50);
    expect(ev.scale).toBe(2);
    expect(ev.rotation).toBe(45); // 单帧恒定
  });

  it('未启用任何通道时全部使用静态值', () => {
    const staticClip = { transform: { x: 9, y: 8, scale: 1, rotation: 0 }, style: { opacity: 1, zIndex: 0 }, keyframes: {} } as unknown as Clip;
    const ev = evaluateClipKeyframes(staticClip, 0.7);
    expect(ev.x).toBe(9);
    expect(ev.y).toBe(8);
    expect(ev.scale).toBe(1);
    expect(ev.rotation).toBe(0);
    expect(ev.opacity).toBe(1);
  });
});
