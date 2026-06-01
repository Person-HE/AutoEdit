import React, { forwardRef } from 'react';
import { TimelineProvider } from '../core/TimelineContext';
import AbsoluteFill from './AbsoluteFill';

export interface VideoFrameProps {
  component: React.ComponentType;
  frame: number;
  width: number;
  height: number;
  backgroundColor?: string;
  fps?: number;
  durationInFrames?: number;
}

export const VideoFrame = forwardRef<HTMLDivElement, VideoFrameProps>(
  (
    {
      component: Component,
      frame,
      width,
      height,
      backgroundColor = '#000',
      fps = 30,
      durationInFrames = 90,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-frame={frame}
        style={{
          width,
          height,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor,
        }}
      >
        <TimelineProvider initialFrame={frame} fps={fps} durationInFrames={durationInFrames}>
          <AbsoluteFill>
            <Component />
          </AbsoluteFill>
        </TimelineProvider>
      </div>
    );
  }
);

VideoFrame.displayName = 'VideoFrame';

export default VideoFrame;
