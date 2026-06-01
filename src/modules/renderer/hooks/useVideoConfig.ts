import { useTimeline } from '../core/TimelineContext';

export interface VideoConfig {
  fps: number;
  durationInFrames: number;
}

export function useVideoConfig(): VideoConfig {
  const { fps, durationInFrames } = useTimeline();

  return {
    fps,
    durationInFrames,
  };
}

export default useVideoConfig;
