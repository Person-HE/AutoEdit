import { useMemo } from 'react';
import { useCurrentFrame } from './useCurrentFrame';

type InputRange = readonly number[];
type OutputRange = readonly number[];

export interface InterpolateOptions {
  extrapolateLeft?: 'extend' | 'clamp' | 'identity';
  extrapolateRight?: 'extend' | 'clamp' | 'identity';
  easing?: (t: number) => number;
}

function interpolate(
  inputValue: number,
  inputRange: InputRange,
  outputRange: OutputRange,
  options?: InterpolateOptions
): number {
  if (inputRange.length !== outputRange.length) {
    console.warn(
      'interpolate: inputRange and outputRange must have the same length'
    );
    return outputRange[0] ?? 0;
  }

  if (inputRange.length === 0) {
    return 0;
  }

  const { extrapolateLeft = 'extend', extrapolateRight = 'extend', easing } =
    options || {};

  let value = inputValue;

  if (easing && inputRange.length === 2) {
    const inputMin = inputRange[0];
    const inputMax = inputRange[1];
    const rangeDiff = inputMax - inputMin;

    if (rangeDiff === 0) {
      return outputRange[0];
    }

    let progress = (value - inputMin) / rangeDiff;

    if (progress < 0 && extrapolateLeft === 'clamp') {
      progress = 0;
    } else if (progress > 1 && extrapolateRight === 'clamp') {
      progress = 1;
    } else if (
      (progress < 0 && extrapolateLeft === 'identity') ||
      (progress > 1 && extrapolateRight === 'identity')
    ) {
      return value;
    }

    progress = Math.max(0, Math.min(1, progress));
    progress = easing(progress);
    value = inputMin + progress * rangeDiff;
  }

  if (value <= inputRange[0]) {
    if (extrapolateLeft === 'identity') {
      return value;
    }
    if (extrapolateLeft === 'clamp') {
      return outputRange[0];
    }
    const rangeDiff = inputRange[1] - inputRange[0];
    if (rangeDiff === 0) return outputRange[0];

    const outputDiff = outputRange[1] - outputRange[0];
    const ratio = outputDiff / rangeDiff;
    return outputRange[0] + (value - inputRange[0]) * ratio;
  }

  if (value >= inputRange[inputRange.length - 1]) {
    if (extrapolateRight === 'identity') {
      return value;
    }
    if (extrapolateRight === 'clamp') {
      return outputRange[outputRange.length - 1];
    }
    const lastIndex = inputRange.length - 1;
    const rangeDiff = inputRange[lastIndex] - inputRange[lastIndex - 1];
    if (rangeDiff === 0) return outputRange[outputRange.length - 1];

    const outputDiff =
      outputRange[outputRange.length - 1] - outputRange[outputRange.length - 2];
    const ratio = outputDiff / rangeDiff;
    return (
      outputRange[outputRange.length - 1] +
      (value - inputRange[lastIndex]) * ratio
    );
  }

  let i = 0;
  for (; i < inputRange.length - 2; i++) {
    if (inputRange[i + 1] > value) break;
  }

  const segmentInputDiff = inputRange[i + 1] - inputRange[i];
  if (segmentInputDiff === 0) {
    return outputRange[i];
  }

  const progress = (value - inputRange[i]) / segmentInputDiff;
  const segmentOutputDiff = outputRange[i + 1] - outputRange[i];

  return outputRange[i] + progress * segmentOutputDiff;
}

export function useInterpolate(
  inputRange: InputRange,
  outputRange: OutputRange,
  options?: InterpolateOptions
): (inputValue?: number) => number {
  const frame = useCurrentFrame();

  return useMemo(() => {
    return (inputValue?: number) => {
      const value = inputValue ?? frame;
      return interpolate(value, inputRange, outputRange, options);
    };
  }, [frame, inputRange, outputRange, options?.easing, options?.extrapolateLeft, options?.extrapolateRight]);
}

export { interpolate };
export default useInterpolate;
