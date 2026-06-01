import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';

export interface TrackInfo {
  id: string;
  name?: string;
  startFrame: number;
  endFrame: number;
  color?: string;
}

export interface PlayerTimelineProps {
  durationInFrames: number;
  fps: number;
  currentFrame: number;
  tracks?: TrackInfo[];
  onSeek: (frame: number) => void;
  scale?: number;
  height?: number;
  showTimecode?: boolean;
}

const DEFAULT_SCALE = 4;
const DEFAULT_HEIGHT = 60;

const formatTimecode = (frame: number, fps: number): string => {
  const totalSeconds = frame / fps;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.round((totalSeconds % 1) * fps);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

const formatTime = (frame: number, fps: number): string => {
  const seconds = frame / fps;
  return `${seconds.toFixed(2)}s`;
};

interface TickMark {
  position: number;
  frame: number;
  isMajor: boolean;
  label?: string;
}

function generateTickMarks(durationInFrames: number, scale: number, fps: number): TickMark[] {
  const ticks: TickMark[] = [];
  const totalWidth = durationInFrames * scale;

  let interval = 1;
  if (totalWidth > 2000) interval = Math.ceil(fps * 5);
  else if (totalWidth > 1000) interval = Math.ceil(fps * 2);
  else if (totalWidth > 500) interval = Math.ceil(fps);
  else if (totalWidth > 250) interval = Math.ceil(fps / 2);
  else if (totalWidth > 100) interval = Math.ceil(fps / 5);

  for (let frame = 0; frame <= durationInFrames; frame += interval) {
    const isMajor = frame % (interval * 5) === 0 || frame === 0 || frame === durationInFrames;
    ticks.push({
      position: frame * scale,
      frame,
      isMajor,
      label: isMajor ? formatTimecode(frame, fps) : undefined,
    });
  }

  for (let frame = 0; frame <= durationInFrames; frame++) {
    if (!ticks.some(t => t.frame === frame)) {
      ticks.push({
        position: frame * scale,
        frame,
        isMajor: false,
      });
    }
  }

  return ticks.sort((a, b) => a.frame - b.frame);
}

export const PlayerTimeline: React.FC<PlayerTimelineProps> = ({
  durationInFrames,
  fps,
  currentFrame,
  tracks = [],
  onSeek,
  scale = DEFAULT_SCALE,
  height = DEFAULT_HEIGHT,
  showTimecode = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalWidth = useMemo(() => durationInFrames * scale, [durationInFrames, scale]);

  const tickMarks = useMemo(
    () => generateTickMarks(durationInFrames, scale, fps),
    [durationInFrames, scale, fps]
  );

  const playheadPosition = useMemo(() => currentFrame * scale, [currentFrame, scale]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frame = Math.max(0, Math.min(Math.round(x / scale), durationInFrames - 1));

      onSeek(frame);
    },
    [scale, durationInFrames, onSeek]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      handleClick(e);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - rect.left;
        const frame = Math.max(0, Math.min(Math.round(x / scale), durationInFrames - 1));
        onSeek(frame);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [scale, durationInFrames, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frame = Math.max(0, Math.min(Math.round(x / scale), durationInFrames - 1));
      setHoveredFrame(frame);
    },
    [scale, durationInFrames]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredFrame(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      className="player-timeline"
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'linear-gradient(to bottom, rgba(20,20,30,0.95), rgba(15,15,25,0.98))',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Timecode Ruler */}
      <div
        style={{
          height: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        {showTimecode &&
          tickMarks
            .filter((tick) => tick.isMajor)
            .map((tick) => (
              <div
                key={`tick-label-${tick.frame}`}
                style={{
                  position: 'absolute',
                  left: `${tick.position}px`,
                  top: 0,
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'monospace',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {tick.label}
              </div>
            ))}
      </div>

      {/* Tracks Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          position: 'relative',
          width: `${totalWidth}px`,
          minWidth: '100%',
          height: tracks.length > 0 ? height - 40 : height - 20,
          overflow: 'visible',
        }}
      >
        {/* Background Grid */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: totalWidth,
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {tickMarks.map((tick) => (
            <line
              key={`grid-${tick.frame}`}
              x1={tick.position}
              y1={0}
              x2={tick.position}
              y2="100%"
              stroke={tick.isMajor ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}
              strokeWidth={tick.isMajor ? 1 : 0.5}
            />
          ))}
        </svg>

        {/* Track Blocks */}
        {tracks.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {tracks.map((track, index) => (
              <div
                key={track.id}
                style={{
                  position: 'absolute',
                  left: track.startFrame * scale,
                  width: (track.endFrame - track.startFrame) * scale,
                  top: index * 24 + 4,
                  height: 20,
                  borderRadius: '3px',
                  background: track.color || `hsl(${index * 45}, 70%, 50%)`,
                  opacity: 0.7,
                  borderLeft: `3px solid ${track.color || `hsl(${index * 45}, 70%, 40%)`}`,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '6px',
                  overflow: 'hidden',
                }}
              >
                {track.name && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      opacity: 0.8,
                    }}
                  >
                    {track.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Playhead */}
        <div
          style={{
            position: 'absolute',
            left: playheadPosition,
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, #ef4444, transparent)',
            zIndex: 10,
            pointerEvents: 'none',
            transition: isDragging ? 'none' : 'left 0.05s linear',
          }}
        >
          {/* Playhead Handle */}
          <div
            style={{
              position: 'absolute',
              top: -2,
              left: '-5px',
              width: '12px',
              height: '12px',
              background: '#ef4444',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
            }}
          />
        </div>

        {/* Hover Tooltip */}
        {hoveredFrame !== null && !isDragging && (
          <div
            style={{
              position: 'absolute',
              left: hoveredFrame * scale,
              top: -28,
              background: 'rgba(0,0,0,0.9)',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            #{hoveredFrame} ({formatTime(hoveredFrame, fps)})
          </div>
        )}
      </div>

      {/* Timeline Info */}
      <div
        style={{
          position: 'absolute',
          right: '12px',
          bottom: '4px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        {formatTimecode(durationInFrames, fps)} | {durationInFrames} frames @ {fps}fps
      </div>
    </div>
  );
};

export default PlayerTimeline;
