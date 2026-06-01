import { useMemo } from 'react';
import { useCurrentFrame } from './useCurrentFrame';
import { useVideoConfig } from './useVideoConfig';
import { simulateSpring } from '../../preset/core/SpringPhysics';

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  from?: number;
  to?: number;
}

export function useSpring(config: SpringConfig = {}): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return useMemo(() => {
    const {
      from = 0,
      to = 1,
      damping = 15,
      stiffness = 100,
      mass = 1,
    } = config;

    const { values, settled } = simulateSpring(from, to, {
      tension: stiffness,
      friction: damping,
      mass,
    });

    if (values.length === 0) return to;

    const timeInSeconds = frame / fps;
    const index = Math.min(
      Math.floor(timeInSeconds * 60),
      values.length - 1
    );

    if (settled && index >= values.length - 1) {
      return to;
    }

    return values[Math.max(0, index)].value;
  }, [
    frame,
    fps,
    config.from,
    config.to,
    config.damping,
    config.stiffness,
    config.mass,
  ]);
}

export default useSpring;
