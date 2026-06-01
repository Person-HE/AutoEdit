import React, { forwardRef } from 'react';
import { useSequence, SequenceContext } from '../core/SequenceContext';
import { useTimeline } from '../core/TimelineContext';

export interface SequenceProps {
  from?: number;
  durationInFrames: number;
  children: React.ReactNode;
}

export const Sequence = forwardRef<HTMLDivElement, SequenceProps>(
  ({ from = 0, durationInFrames, children }, ref) => {
    const parentSequence = useSequence();
    const { frame } = useTimeline();

    const cumulatedFrom =
      (parentSequence?.cumulatedFrom ?? 0) +
      (parentSequence?.relativeFrom ?? 0);

    const absoluteStart = cumulatedFrom + from;
    const absoluteEnd = absoluteStart + durationInFrames;

    const isVisible = frame >= absoluteStart && frame < absoluteEnd;

    if (!isVisible) {
      return null;
    }

    const contextValue = {
      cumulatedFrom,
      relativeFrom: from,
      durationInFrames,
    };

    return (
      <SequenceContext.Provider value={contextValue}>
        <div ref={ref}>{children}</div>
      </SequenceContext.Provider>
    );
  }
);

Sequence.displayName = 'Sequence';

export default Sequence;
