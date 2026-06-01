import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TimelineProvider, useTimeline } from '../core/TimelineContext';
import { AbsoluteFill } from '../components/AbsoluteFill';
import PlayerControls from './PlayerControls';
import PlayerTimeline from './PlayerTimeline';

export interface PlayerProps {
  component: React.ComponentType;
  durationInFrames: number;
  fps?: number;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentFrame: number;
  playbackSpeed: number;
}

const PLAYER_DEFAULTS = {
  fps: 30,
  width: 1920,
  height: 1080,
  autoPlay: false,
  loop: true,
  controls: true,
};

function PlayerInner({ component: Component, width, height, controls, style, className }: Omit<PlayerProps, 'durationInFrames' | 'fps' | 'autoPlay' | 'loop'>) {
  const { frame, setFrame, fps, durationInFrames, playing, setPlaying } = useTimeline();
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const startFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastTimeRef.current = performance.now();
    startFrameRef.current = frame;

    const tick = (currentTime: number) => {
      const elapsed = (currentTime - lastTimeRef.current) * playbackSpeed;
      const framesToAdvance = Math.floor((elapsed / 1000) * fps);

      if (framesToAdvance > 0) {
        lastTimeRef.current = currentTime;
        let nextFrame = frame + framesToAdvance;

        if (nextFrame >= durationInFrames) {
          nextFrame = 0;
        }

        setFrame(nextFrame);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, fps, durationInFrames, playbackSpeed]);

  const handlePlayPause = useCallback(() => {
    setPlaying(!playing);
  }, [playing, setPlaying]);

  const handleSeekByTime = useCallback((time: number) => {
    const newFrame = Math.floor(time * fps);
    setFrame(Math.max(0, Math.min(newFrame, durationInFrames - 1)));
  }, [fps, durationInFrames, setFrame]);

  const handleSeekByFrame = useCallback((frameNumber: number) => {
    setFrame(Math.max(0, Math.min(frameNumber, durationInFrames - 1)));
  }, [durationInFrames, setFrame]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  const currentTimeInSeconds = frame / fps;
  const totalDurationInSeconds = durationInFrames / fps;

  const containerStyle: React.CSSProperties = useMemo(() => ({
    position: 'relative',
    width: width ?? '100%',
    height: height ?? 'auto',
    aspectRatio: `${width ?? 1920} / ${height ?? 1080}`,
    backgroundColor: '#000',
    overflow: 'hidden',
    ...style,
  }), [width, height, style]);

  return (
    <div className={`remotion-player ${className || ''}`} style={containerStyle}>
      <AbsoluteFill>
        <Component />
      </AbsoluteFill>

      {controls && (
        <>
          <div className="player-controls-overlay">
            <PlayerControls
              isPlaying={playing}
              currentTime={currentTimeInSeconds}
              duration={totalDurationInSeconds}
              fps={fps}
              onPlayPause={handlePlayPause}
              onSeek={handleSeekByTime}
              onSeekFrame={handleSeekByFrame}
              onSpeedChange={handleSpeedChange}
            />
          </div>

          <div className="player-timeline-overlay">
            <PlayerTimeline
              durationInFrames={durationInFrames}
              fps={fps}
              currentFrame={frame}
              onSeek={handleSeekByFrame}
            />
          </div>
        </>
      )}
    </div>
  );
}

export const Player: React.FC<PlayerProps> = ({
  component,
  durationInFrames,
  fps = PLAYER_DEFAULTS.fps,
  width = PLAYER_DEFAULTS.width,
  height = PLAYER_DEFAULTS.height,
  autoPlay = PLAYER_DEFAULTS.autoPlay,
  loop = PLAYER_DEFAULTS.loop,
  controls = PLAYER_DEFAULTS.controls,
  style,
  className,
}) => {
  const [initialPlaying] = useState(autoPlay);

  return (
    <TimelineProvider
      fps={fps}
      durationInFrames={durationInFrames}
      initialFrame={0}
    >
      <PlayerInner
        component={component}
        width={width}
        height={height}
        controls={controls}
        style={style}
        className={className}
      />
    </TimelineProvider>
  );
};

export default Player;
