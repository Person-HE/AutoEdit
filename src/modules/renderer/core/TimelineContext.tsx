import React, { createContext, useContext, useState, useCallback } from 'react';

export interface TimelineContextValue {
  frame: number;
  setFrame: (frame: number) => void;
  fps: number;
  durationInFrames: number;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
}

const DEFAULT_CONTEXT_VALUE: TimelineContextValue = {
  frame: 0,
  setFrame: () => {},
  fps: 30,
  durationInFrames: 90,
  playing: false,
  setPlaying: () => {},
};

const TimelineContext = createContext<TimelineContextValue>(DEFAULT_CONTEXT_VALUE);

export interface TimelineProviderProps {
  children: React.ReactNode;
  fps?: number;
  durationInFrames?: number;
  initialFrame?: number;
}

export function TimelineProvider({
  children,
  fps = 30,
  durationInFrames = 90,
  initialFrame = 0,
}: TimelineProviderProps) {
  const [frame, setFrameState] = useState(initialFrame);
  const [playing, setPlaying] = useState(false);

  const setFrame = useCallback(
    (f: number) => {
      setFrameState(Math.max(0, Math.min(f, durationInFrames - 1)));
    },
    [durationInFrames]
  );

  const value: TimelineContextValue = {
    frame,
    setFrame,
    fps,
    durationInFrames,
    playing,
    setPlaying,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline(): TimelineContextValue {
  return useContext(TimelineContext);
}

export { TimelineContext };
