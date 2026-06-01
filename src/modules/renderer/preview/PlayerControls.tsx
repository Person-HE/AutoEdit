import React, { useState, useCallback, useRef, useMemo } from 'react';

export interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  fps: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSeekFrame: (frame: number) => void;
  onSpeedChange?: (speed: number) => void;
  className?: string;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const milliseconds = Math.floor((time % 1) * 100);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  fps,
  onPlayPause,
  onSeek,
  onSeekFrame,
  onSpeedChange,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const progressPercent = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percent * duration;

    onSeek(newTime);
  }, [duration, onSeek]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percent * duration;
      onSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [duration, onSeek]);

  const handleSpeedSelect = useCallback((speed: number) => {
    setCurrentSpeed(speed);
    onSpeedChange?.(speed);
    setShowSpeedMenu(false);
  }, [onSpeedChange]);

  const currentFrame = Math.floor(currentTime * fps);

  return (
    <div
      className={`player-controls ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        color: '#fff',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Play/Pause Button */}
      <button
        onClick={onPlayPause}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.15)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Current Time */}
      <span
        style={{
          minWidth: '85px',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '13px',
          opacity: 0.9,
        }}
      >
        {formatTime(currentTime)}
      </span>

      {/* Progress Bar */}
      <div
        ref={progressRef}
        onMouseDown={handleProgressMouseDown}
        style={{
          flex: 1,
          height: '6px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '3px',
          cursor: 'pointer',
          position: 'relative',
          transition: isDragging ? 'none' : 'height 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isDragging) e.currentTarget.style.height = '8px';
        }}
        onMouseLeave={(e) => {
          if (!isDragging) e.currentTarget.style.height = '6px';
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: '3px',
            transition: isDragging ? 'none' : 'width 0.1s linear',
          }}
        />

        {/* Progress Thumb */}
        <div
          style={{
            position: 'absolute',
            left: `${progressPercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            opacity: isDragging ? 1 : 0,
            transition: isDragging ? 'none' : 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Duration */}
      <span
        style={{
          minWidth: '85px',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '13px',
          opacity: 0.9,
        }}
      >
        {formatTime(duration)}
      </span>

      {/* FPS Display */}
      <span
        style={{
          fontSize: '11px',
          padding: '2px 6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          fontVariantNumeric: 'tabular-nums',
          opacity: 0.7,
        }}
      >
        {fps}fps
      </span>

      {/* Frame Counter */}
      <span
        style={{
          fontSize: '11px',
          padding: '2px 6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          fontVariantNumeric: 'tabular-nums',
          opacity: 0.7,
        }}
      >
        #{currentFrame}
      </span>

      {/* Speed Control */}
      {onSpeedChange && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            style={{
              padding: '4px 8px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontVariantNumeric: 'tabular-nums',
              transition: 'all 0.2s ease',
            }}
            title={`播放速度: ${currentSpeed}x`}
          >
            {currentSpeed}x
          </button>

          {showSpeedMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '4px',
                background: 'rgba(30,30,40,0.95)',
                borderRadius: '8px',
                padding: '4px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(10px)',
                zIndex: 100,
              }}
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedSelect(speed)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 16px',
                    border: 'none',
                    background: currentSpeed === speed ? 'rgba(59,130,246,0.3)' : 'transparent',
                    color: currentSpeed === speed ? '#3b82f6' : '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    borderRadius: '4px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (currentSpeed !== speed)
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (currentSpeed !== speed)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {speed}x{speed === 1 && ' (正常)'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Volume Placeholder */}
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.5,
          cursor: 'not-allowed',
        }}
        title="音量控制（即将推出）"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      </div>
    </div>
  );
};

export default PlayerControls;
