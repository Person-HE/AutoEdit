export interface TimelineDriverConfig {
  fps?: 60 | 120 | 'adaptive';
  duration: number;
  autoPlay?: boolean;
  loop?: boolean;
  yoyo?: boolean;
}

export type TimelineEvent =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'seek'; time: number; progress: number }
  | { type: 'complete' }
  | { type: 'loop' };

export interface TimelineCallbacks {
  onFrame?: (time: number, progress: number) => void;
  onPlay?: () => void;
  onPause?: (time: number) => void;
  onStop?: () => void;
  onComplete?: () => void;
  onLoop?: (loopCount: number) => void;
}

type TimelineEventListener = (event: TimelineEvent) => void;

export class TimelineDriver {
  private config: Required<TimelineDriverConfig>;
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  private listeners: Set<TimelineEventListener> = new Set();
  private callbacks: TimelineCallbacks = {};
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private accumulatedTime: number = 0;
  private loopCount: number = 0;
  private direction: 1 | -1 = 1;
  private disposed: boolean = false;

  constructor(config: TimelineDriverConfig) {
    this.config = {
      fps: config.fps ?? 60,
      duration: Math.max(0, config.duration),
      autoPlay: config.autoPlay ?? false,
      loop: config.loop ?? false,
      yoyo: config.yoyo ?? false,
    };

    if (this.config.autoPlay && !this.disposed) {
      setTimeout(() => this.play(), 0);
    }
  }

  on(listener: TimelineEventListener): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setCallbacks(callbacks: Partial<TimelineCallbacks>): void {
    Object.assign(this.callbacks, callbacks);
  }

  play(): void {
    if (this.disposed || this.isPlaying) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.accumulatedTime = 0;
    this.emit({ type: 'play' });
    this.callbacks.onPlay?.();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  pause(): void {
    if (!this.isPlaying || this.disposed) return;
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.emit({ type: 'pause' });
    this.callbacks.onPause?.(this.currentTime);
  }

  stop(): void {
    this.pause();
    this.currentTime = 0;
    this.accumulatedTime = 0;
    this.direction = 1;
    this.loopCount = 0;
    this.lastTimestamp = null;
    this.emit({ type: 'stop' });
    this.callbacks.onStop?.();
  }

  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this.config.duration));
    this.currentTime = clampedTime;
    this.accumulatedTime = clampedTime * 1000;
    this.emit({ type: 'seek', time: this.currentTime, progress: this.getProgress() });
    this.callbacks.onFrame?.(this.currentTime, this.getProgress());
  }

  seekProgress(progress: number): void {
    this.seek(progress * this.config.duration);
  }

  setLoop(loop: boolean): void {
    this.config.loop = loop;
  }

  setYoyo(yoyo: boolean): void {
    this.config.yoyo = yoyo;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getProgress(): number {
    return this.config.duration > 0 ? this.currentTime / this.config.duration : 0;
  }

  getDuration(): number {
    return this.config.duration;
  }

  getLoopCount(): number {
    return this.loopCount;
  }

  isPlayingNow(): boolean {
    return this.isPlaying;
  }

  getDirection(): 1 | -1 {
    return this.direction;
  }

  private tick = (timestamp: number): void => {
    if (!this.isPlaying || this.disposed) return;

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }

    const rawDelta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    let deltaMs = rawDelta;
    const maxDeltaMs = 100;
    if (deltaMs > maxDeltaMs) {
      deltaMs = maxDeltaMs;
    }

    if (this.config.fps !== 'adaptive') {
      const targetFrameInterval = 1000 / this.config.fps;
      this.accumulatedTime += deltaMs;

      while (this.accumulatedTime >= targetFrameInterval && this.isPlaying) {
        this.accumulatedTime -= targetFrameInterval;
        this.advanceTime(targetFrameInterval / 1000);

        if (!this.isPlaying) break;
      }
    } else {
      this.advanceTime(deltaMs / 1000);
    }

    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };

  private advanceTime(dt: number): void {
    const prevTime = this.currentTime;
    this.currentTime += dt * this.direction;

    if (this.config.yoyo && this.config.loop) {
      if (this.currentTime >= this.config.duration) {
        this.currentTime = this.config.duration;
        this.direction = -1;
        this.loopCount++;
        this.emit({ type: 'loop' });
        this.callbacks.onLoop?.(this.loopCount);
      } else if (this.currentTime <= 0) {
        this.currentTime = 0;
        this.direction = 1;
        this.loopCount++;
        this.emit({ type: 'loop' });
        this.callbacks.onLoop?.(this.loopCount);
      } else {
        this.emitFrame();
      }
    } else if (this.config.loop) {
      if (this.currentTime >= this.config.duration) {
        this.currentTime -= this.config.duration;
        this.loopCount++;
        this.emit({ type: 'loop' });
        this.callbacks.onLoop?.(this.loopCount);
      } else {
        this.emitFrame();
      }
    } else {
      if (this.currentTime >= this.config.duration) {
        this.currentTime = this.config.duration;
        this.emitFrame();
        this.pause();
        this.emit({ type: 'complete' });
        this.callbacks.onComplete?.();
      } else if (this.currentTime < 0) {
        this.currentTime = 0;
        this.pause();
        this.emit({ type: 'complete' });
        this.callbacks.onComplete?.();
      } else {
        this.emitFrame();
      }
    }
  }

  private emitFrame(): void {
    this.emit({
      type: 'seek',
      time: this.currentTime,
      progress: this.getProgress(),
    });
    this.callbacks.onFrame?.(this.currentTime, this.getProgress());
  }

  private emit(event: TimelineEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('TimelineDriver listener error:', error);
      }
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.listeners.clear();
    this.callbacks = {};
    this.animationFrameId = null;
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}
