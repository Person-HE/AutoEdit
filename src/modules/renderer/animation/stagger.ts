import type { EasingFunction } from '../../preset/core/EasingLibrary';

export interface StaggerOptions {
  start?: number;
  amount?: number;
  from?: 'first' | 'last' | 'center' | number;
  ease?: EasingFunction;
}

export function stagger(
  count: number,
  options: StaggerOptions = {}
): number[] {
  const {
    start = 0,
    amount = 5,
    from = 'first',
    ease = (t: number) => t,
  } = options;

  if (count <= 0) return [];
  if (count === 1) return [start];

  const delays: number[] = new Array(count);

  const maxIndex = count - 1;

  for (let i = 0; i < count; i++) {
    let normalizedIndex: number;

    switch (from) {
      case 'last':
        normalizedIndex = (maxIndex - i) / maxIndex;
        break;
      case 'center':
        const center = maxIndex / 2;
        normalizedIndex = Math.abs(i - center) / center;
        break;
      case 'first':
      default:
        normalizedIndex = i / maxIndex;
        break;
    }

    if (typeof from === 'number') {
      normalizedIndex = Math.abs(i - from) / Math.max(Math.max(from, maxIndex - from), 1);
    }

    normalizedIndex = Math.max(0, Math.min(1, normalizedIndex));
    const easedProgress = ease(normalizedIndex);

    delays[i] = start + easedProgress * amount;
  }

  return delays;
}

export function createStagger(
  options: StaggerOptions = {}
): (count: number) => number[] {
  return (count: number) => stagger(count, options);
}

export default stagger;
