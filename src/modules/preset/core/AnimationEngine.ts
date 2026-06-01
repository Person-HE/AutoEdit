import type { Transform } from '../../shared/types';
import { resolveEasing, type EasingFunction } from './EasingLibrary';
import {
  createSpringConfig,
  springAnimation,
  type SpringConfig,
  type SpringResult,
} from './SpringPhysics';
import { validateAnimationProps, WillChangeManager, PerformanceMonitor } from './GPURenderer';
import { TimelineDriver, type TimelineDriverConfig } from './TimelineDriver';

export interface AnimationOptions<T extends Record<string, number> = Record<string, number>> {
  target: T;
  from?: Partial<T>;
  to: T;
  duration?: number;
  easing?: string | EasingFunction;
  spring?: SpringConfig;
  delay?: number;
  loop?: boolean;
  yoyo?: boolean;
  onUpdate?: (values: T, progress: number) => void;
  onComplete?: (values: T) => void;
  onStart?: () => void;
  gpuAccelerated?: boolean;
}

export interface StaggerOptions<T extends Record<string, number> = Record<string, number>> {
  targets: T[];
  options: Omit<AnimationOptions<T>, 'target'> & {
    stagger?: number | ((index: number, total: number) => number);
    from?: 'start' | 'end' | 'center' | 'edges' | number;
  };
}

export interface AnimationController<T extends Record<string, number> = Record<string, number>> {
  id: string;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (progress: number) => void;
  getCurrentValues: () => T;
  getProgress: () => number;
  isPlaying: () => boolean;
  dispose: () => void;
}

interface TimelineAction {
  type: 'animate' | 'delay';
  animation?: InternalAnimation<any>;
  delay?: number;
}

class TimelineImpl {
  private actions: TimelineAction[] = [];
  private position: number = 0;
  private driver: TimelineDriver | null = null;

  add<T extends Record<string, number>>(
    target: T,
    options: Omit<AnimationOptions<T>, 'target'>
  ): this {
    const anim = createInternalAnimation(target, { ...options, target });
    this.actions.push({ type: 'animate', animation: anim });
    return this;
  }

  to<T extends Record<string, number>>(target: T, options: Omit<AnimationOptions<T>, 'from' | 'target'>): this {
    return this.add(target, options as any);
  }

  fromTo<T extends Record<string, number>>(
    target: T,
    from: Partial<T>,
    options: Omit<AnimationOptions<T>, 'from' | 'target'>
  ): this {
    return this.add(target, { ...options, from });
  }

  delay(duration: number): this {
    this.actions.push({ type: 'delay', delay: duration });
    return this;
  }

  play(): void {
    if (!this.driver) {
      const totalDuration = this.actions.reduce((acc, action) => {
        if (action.type === 'delay') return acc + (action.delay ?? 0);
        if (action.animation) return acc + (action.animation.duration ?? 0);
        return acc;
      }, 0);

      this.driver = new TimelineDriver({
        duration: Math.max(totalDuration, 0.001),
        autoPlay: false,
      });

      this.driver.setCallbacks({
        onFrame: (time) => this.onFrame(time),
        onComplete: () => this.onComplete(),
      });
    }
    this.driver.play();
  }

  pause(): void {
    this.driver?.pause();
  }

  stop(): void {
    this.driver?.stop();
  }

  seek(progress: number): void {
    this.driver?.seekProgress(progress);
  }

  dispose(): void {
    this.driver?.dispose();
    this.driver = null;
    this.actions.forEach((action) => {
      action.animation?.dispose?.();
    });
    this.actions = [];
  }

  private onFrame(time: number): void {
    let currentTime = 0;
    for (const action of this.actions) {
      if (action.type === 'delay') {
        currentTime += action.delay ?? 0;
      } else if (action.animation && action.type === 'animate') {
        const animDuration = action.animation.duration ?? 1;
        if (time >= currentTime && time <= currentTime + animDuration) {
          const localProgress = (time - currentTime) / animDuration;
          action.animation.update(localProgress);
        } else if (time > currentTime + animDuration) {
          action.animation.update(1);
        }
        currentTime += animDuration;
      }
    }
  }

  private onComplete(): void {
    this.actions.forEach((action) => {
      action.animation?.onCompleteCallback?.();
    });
  }
}

type Timeline = InstanceType<typeof TimelineImpl>;

let globalIdCounter = 0;

function generateId(): string {
  return `anim_${Date.now()}_${++globalIdCounter}`;
}

interface InternalAnimation<T extends Record<string, number> = Record<string, number>> {
  id: string;
  target: T;
  from: T;
  to: T;
  duration: number;
  easing: EasingFunction;
  springConfig: Required<SpringConfig> | null;
  delay: number;
  onUpdate?: (values: T, progress: number) => void;
  onComplete?: (values: T) => void;
  onStart?: () => void;
  useSpring: boolean;
  currentValues: T;
  driver: TimelineDriver | null;
  disposed: boolean;
  completed: boolean;
  onCompleteCallback?: () => void;
  dispose: () => void;
  update: (progress: number) => void;
}

function createInternalAnimation<T extends Record<string, number>>(
  target: T,
  options: AnimationOptions<T>
): InternalAnimation<T> {
  const id = generateId();
  const keys = Object.keys(target) as (keyof T)[];
  const from: T = { ...target, ...(options.from ?? {}) } as T;
  const to: T = { ...options.to };

  const duration = options.spring
    ? 2
    : options.duration ?? 0.6;
  const easing = resolveEasing(options.easing);
  const springConfig = options.spring ? createSpringConfig(options.spring) : null;
  const useSpring = !!springConfig;

  const currentValues: T = { ...from };
  let disposed = false;
  let completed = false;
  let driver: TimelineDriver | null = null;
  let onCompleteCallback: (() => void) | undefined;

  function update(progress: number): void {
    if (disposed || completed) return;

    const clampedProgress = Math.max(0, Math.min(1, progress));

    keys.forEach((key) => {
      const fromVal = Number(from[key]) || 0;
      const toVal = Number(to[key]) || 0;

      let value: number;
      if (useSpring && springConfig) {
        const frame = Math.floor(clampedProgress * 60 * duration);
        const result: SpringResult = springAnimation(frame, 60, springConfig, fromVal, toVal);
        value = result.value;
      } else {
        const easedProgress = easing(clampedProgress);
        value = fromVal + (toVal - fromVal) * easedProgress;
      }

      (currentValues as any)[key] = value;
    });

    options.onUpdate?.(currentValues, clampedProgress);

    if (clampedProgress >= 1 && !completed) {
      completed = true;
      options.onComplete?.(currentValues);
      onCompleteCallback?.();
    }
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    driver?.dispose();
    driver = null;
  }

  return {
    id,
    target,
    from,
    to,
    duration,
    easing,
    springConfig,
    delay: options.delay ?? 0,
    onUpdate: options.onUpdate,
    onComplete: options.onComplete,
    onStart: options.onStart,
    useSpring,
    currentValues,
    driver,
    disposed,
    completed,
    onCompleteCallback,
    dispose,
    update,
  };
}

class AnimationEngineClass {
  private activeAnimations: Map<string, InternalAnimation> = new Map();
  private willChangeManager: WillChangeManager;
  private performanceMonitor: PerformanceMonitor;
  private globalPaused: boolean = false;

  constructor() {
    this.willChangeManager = new WillChangeManager();
    this.performanceMonitor = new PerformanceMonitor({
      onWarning: (metrics) => {
        console.warn(`[AnimationEngine] Performance warning: ${metrics.fps} FPS`);
      },
      onCritical: (metrics) => {
        console.error(`[AnimationEngine] Critical performance issue: ${metrics.fps} FPS`);
      },
    });
  }

  animate<T extends Record<string, number> = Record<string, number>>(
    options: AnimationOptions<T>
  ): AnimationController<T> {
    const internalAnim = createInternalAnimation(options.target, options);

    if (options.gpuAccelerated !== false) {
      const propsToValidate: Record<string, unknown> = {};
      Object.keys(options.to).forEach((key) => {
        propsToValidate[key] = true;
      });
      const validation = validateAnimationProps(propsToValidate);
      if (!validation.valid && validation.unsafeProps.length > 0) {
        console.warn(
          `[AnimationEngine] Non-GPU-accelerated properties detected:`,
          validation.unsafeProps
        );
      }
    }

    internalAnim.onCompleteCallback = () => {
      this.activeAnimations.delete(internalAnim.id);
    };

    this.activeAnimations.set(internalAnim.id, internalAnim);

    const controller: AnimationController<T> = {
      id: internalAnim.id,

      play: () => {
        if (internalAnim.disposed) return;
        internalAnim.onStart?.();

        if (internalAnim.driver) {
          internalAnim.driver.dispose();
        }

        const totalDuration = internalAnim.delay + internalAnim.duration;
        internalAnim.driver = new TimelineDriver({
          duration: totalDuration,
          autoPlay: !this.globalPaused,
          loop: options.loop ?? false,
          yoyo: options.yoyo ?? false,
        });

        internalAnim.driver.setCallbacks({
          onFrame: (time) => {
            this.performanceMonitor.recordFrame();

            if (time < internalAnim.delay) {
              return;
            }

            const animTime = time - internalAnim.delay;
            const animDuration = internalAnim.duration;
            const progress = animDuration > 0 ? animTime / animDuration : 1;

            internalAnim.update(progress);
          },

          onComplete: () => {
            if (!internalAnim.completed) {
              internalAnim.update(1);
            }
          },
        });

        if (!this.globalPaused) {
          internalAnim.driver.play();
        }
      },

      pause: () => {
        internalAnim.driver?.pause();
      },

      resume: () => {
        if (!this.globalPaused && !internalAnim.disposed) {
          internalAnim.driver?.play();
        }
      },

      stop: () => {
        internalAnim.dispose();
        this.activeAnimations.delete(internalAnim.id);
      },

      seek: (progress: number) => {
        internalAnim.update(progress);
      },

      getCurrentValues: () => ({ ...internalAnim.currentValues }),

      getProgress: () => {
        if (internalAnim.driver) {
          return internalAnim.driver.getProgress();
        }
        return internalAnim.completed ? 1 : 0;
      },

      isPlaying: () => {
        return internalAnim.driver?.isPlayingNow() ?? false;
      },

      dispose: () => {
        internalAnim.dispose();
        this.activeAnimations.delete(internalAnim.id);
      },
    };

    if (options.delay === undefined || options.delay === 0) {
      controller.play();
    } else {
      setTimeout(() => {
        if (!internalAnim.disposed) {
          controller.play();
        }
      }, 0);
    }

    return controller;
  }

  stagger<T extends Record<string, number> = Record<string, number>>(
    targets: T[],
    options: StaggerOptions<T>
  ): AnimationController<T>[] {
    const { stagger: staggerOption, from: staggerFrom, ...animOptions } = options.options;
    const controllers: AnimationController<T>[] = [];

    const totalTargets = targets.length;

    targets.forEach((target, index) => {
      let delay = 0;

      if (typeof staggerOption === 'number') {
        delay = staggerOption * index;
      } else if (typeof staggerOption === 'function') {
        delay = staggerOption(index, totalTargets);
      }

      if (staggerFrom !== undefined) {
        if (staggerFrom === 'end') {
          delay = typeof staggerOption === 'number' ? staggerOption * (totalTargets - 1 - index) : delay;
        } else if (staggerFrom === 'center') {
          const centerIndex = (totalTargets - 1) / 2;
          const offset = index - centerIndex;
          delay =
            typeof staggerOption === 'number'
              ? staggerOption * Math.abs(offset)
              : delay * (offset >= 0 ? 1 : -1);
        } else if (staggerFrom === 'edges') {
          const edgeIndex =
            index < totalTargets / 2 ? index : totalTargets - 1 - index;
          delay = typeof staggerOption === 'number' ? staggerOption * edgeIndex : delay;
        } else if (typeof staggerFrom === 'number') {
          delay = typeof staggerOption === 'number' ? staggerOption * Math.abs(index - staggerFrom) : delay;
        }
      }

      const controller = this.animate({
        target,
        ...animOptions,
        delay: (animOptions.delay ?? 0) + delay,
      });

      controllers.push(controller);
    });

    return controllers;
  }

  timeline(): Timeline {
    return new TimelineImpl();
  }

  globalPause(): void {
    this.globalPaused = true;
    this.activeAnimations.forEach((anim) => {
      anim.driver?.pause();
    });
  }

  globalResume(): void {
    this.globalPaused = false;
    this.activeAnimations.forEach((anim) => {
      if (!anim.disposed && !anim.completed) {
        anim.driver?.play();
      }
    });
  }

  getActiveAnimationsCount(): number {
    return this.activeAnimations.size;
  }

  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  getWillChangeManager(): WillChangeManager {
    return this.willChangeManager;
  }

  disposeAll(): void {
    this.activeAnimations.forEach((anim) => {
      anim.dispose();
    });
    this.activeAnimations.clear();
    this.willChangeManager.dispose();
    this.performanceMonitor.dispose();
  }
}

export const AnimationEngine = new AnimationEngineClass();

export { AnimationEngineClass, TimelineImpl };
