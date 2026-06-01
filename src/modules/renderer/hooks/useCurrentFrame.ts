import { useTimeline } from '../core/TimelineContext';
import { useSequence } from '../core/SequenceContext';

export function useCurrentFrame(): number {
  const { frame } = useTimeline();
  const sequenceContext = useSequence();

  const contextOffset =
    (sequenceContext?.cumulatedFrom ?? 0) + (sequenceContext?.relativeFrom ?? 0);

  return frame - contextOffset;
}

export default useCurrentFrame;
