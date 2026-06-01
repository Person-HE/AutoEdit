import React, { createContext, useContext } from 'react';
import { useTimeline } from './TimelineContext';

export interface SequenceContextValue {
  cumulatedFrom: number;
  relativeFrom: number;
  durationInFrames: number;
}

const DEFAULT_SEQUENCE_CONTEXT: SequenceContextValue = {
  cumulatedFrom: 0,
  relativeFrom: 0,
  durationInFrames: Infinity,
};

const SequenceContext = createContext<SequenceContextValue>(DEFAULT_SEQUENCE_CONTEXT);

export function useSequence(): SequenceContextValue {
  return useContext(SequenceContext);
}

export interface SequenceProps {
  from?: number;
  durationInFrames: number;
  children: React.ReactNode;
}

export function Sequence({ from = 0, durationInFrames, children }: SequenceProps) {
  const parentSequence = useSequence();
  const { frame } = useTimeline();

  const cumulatedFrom =
    (parentSequence?.cumulatedFrom ?? 0) + (parentSequence?.relativeFrom ?? 0);

  const absoluteStart = cumulatedFrom + from;
  const absoluteEnd = absoluteStart + durationInFrames;

  const isVisible = frame >= absoluteStart && frame < absoluteEnd;

  if (!isVisible) {
    return null;
  }

  const contextValue: SequenceContextValue = {
    cumulatedFrom,
    relativeFrom: from,
    durationInFrames,
  };

  return (
    <SequenceContext.Provider value={contextValue}>
      {children}
    </SequenceContext.Provider>
  );
}

export const SequenceProvider: React.FC<SequenceProps> = Sequence;

export { SequenceContext };
