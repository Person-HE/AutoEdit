import { simulateSpring, type SpringConfig } from '../../preset/core/SpringPhysics';

export interface SpringOptions {
  frame: number;
  fps?: number;
  config?: Partial<SpringConfig>;
  from?: number;
  to?: number;
}

export function spring({
  frame,
  fps = 30,
  config = {},
  from = 0,
  to = 1,
}: SpringOptions): number {
  const { values, settled } = simulateSpring(from, to, config, fps);

  if (values.length === 0) return to;

  const index = Math.min(Math.floor(frame), values.length - 1);

  if (settled && index >= values.length - 1) {
    return to;
  }

  return values[Math.max(0, index)].value;
}

export function createSpringAnimation(
  config: Partial<SpringConfig> = {},
  from: number = 0,
  to: number = 1,
  fps: number = 30
): (frame: number) => number {
  const { values, settled } = simulateSpring(from, to, config, fps);
  const targetValue = to;

  return (frame: number): number => {
    if (values.length === 0) return targetValue;

    const index = Math.min(Math.floor(frame), values.length - 1);

    if (settled && index >= values.length - 1) {
      return targetValue;
    }

    return values[Math.max(0, index)].value;
  };
}

export default spring;
