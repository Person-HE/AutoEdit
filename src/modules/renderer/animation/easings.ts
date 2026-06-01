export {
  Easings,
  getEasing,
  resolveEasing,
  linear,
  none,
  power0,
  power1,
  power2,
  power3,
  power4,
  quad,
  cubic,
  quart,
  quint,
  sine,
  circ,
  expo,
  elastic,
  back,
  bounce,
  rough,
  stepped,
  type EasingFunction,
} from '../../preset/core/EasingLibrary';

import type { EasingFunction } from '../../preset/core/EasingLibrary';
import { interpolate } from './interpolate';

export interface FrameInterpolationOptions {
  inputRange: [number, number];
  outputRange: [number, number];
  easing?: EasingFunction;
}

export function frameInterpolation(options: FrameInterpolationOptions): (frame: number) => number {
  const { inputRange, outputRange, easing } = options;

  return (frame: number) => {
    return interpolate(frame, inputRange, outputRange, { easing });
  };
}

export interface KeyframeConfig {
  time: number;
  value: number;
  easing?: EasingFunction;
}

export function keyframe(
  frames: readonly KeyframeConfig[],
  currentTime: number
): number {
  if (frames.length === 0) return 0;
  if (frames.length === 1) return frames[0].value;

  if (currentTime <= frames[0].time) {
    return frames[0].value;
  }

  if (currentTime >= frames[frames.length - 1].time) {
    return frames[frames.length - 1].value;
  }

  for (let i = 0; i < frames.length - 1; i++) {
    const current = frames[i];
    const next = frames[i + 1];

    if (currentTime >= current.time && currentTime <= next.time) {
      const duration = next.time - current.time;
      if (duration === 0) return current.value;

      let progress = (currentTime - current.time) / duration;
      progress = Math.max(0, Math.min(1, progress));

      const easingFn = current.easing ?? ((t: number) => t);
      progress = easingFn(progress);

      return current.value + progress * (next.value - current.value);
    }
  }

  return frames[frames.length - 1].value;
}
