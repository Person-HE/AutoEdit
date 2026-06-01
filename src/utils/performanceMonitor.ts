interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory: number | null;
  renderCount: number;
  lastUpdate: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memory: null,
    renderCount: 0,
    lastUpdate: 0,
  };
  private frameCount = 0;
  private lastFrameTime = 0;
  private running = false;
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = [];

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.measure();
  }

  stop() {
    this.running = false;
  }

  private measure = () => {
    if (!this.running) return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.frameCount++;

    if (delta >= 1000) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / delta);
      this.metrics.frameTime = Math.round(delta / this.frameCount);
      this.metrics.renderCount = this.frameCount;
      this.metrics.lastUpdate = now;

      if ('memory' in performance) {
        const mem = (performance as any).memory;
        this.metrics.memory = mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : null;
      }

      this.callbacks.forEach(cb => cb(this.metrics));

      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    requestAnimationFrame(this.measure);
  };

  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  logMetrics() {
    console.log('[Performance]', {
      fps: this.metrics.fps,
      frameTime: `${this.metrics.frameTime}ms`,
      memory: this.metrics.memory ? `${this.metrics.memory}MB` : 'N/A',
    });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): T {
  let inThrottle = false;
  return ((...args: any[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export function memoizeOne<T extends (...args: any[]) => any>(fn: T): T {
  let lastArgs: any[] | null = null;
  let lastResult: any;
  return ((...args: any[]) => {
    if (
      lastArgs &&
      args.length === lastArgs.length &&
      args.every((arg, i) => arg === lastArgs![i])
    ) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  }) as T;
}
