export type GPUSafeProperty = 'transform' | 'opacity' | 'filter';

export interface GPUCapableProps {
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  safeProps: GPUSafeProperty[];
  unsafeProps: string[];
  suggestions: Record<string, string>;
}

const GPU_SAFE_PROPERTIES: Set<string> = new Set<GPUSafeProperty>([
  'transform',
  'opacity',
  'filter',
]);

const ALTERNATIVE_SUGGESTIONS: Record<string, string> = {
  width: 'transform: scaleX()',
  height: 'transform: scaleY()',
  top: 'transform: translateY()',
  left: 'transform: translateX()',
  bottom: 'transform: translateY()',
  right: 'transform: translateX()',
  margin: 'use transform or padding with will-change',
  padding: 'use transform or consider box-sizing',
  background: 'opacity overlay technique',
  color: 'opacity overlay technique',
  border: 'use filter: drop-shadow() or clip-path',
  'border-radius': 'use clip-path for complex shapes',
  'box-shadow': 'filter: drop-shadow()',
  display: 'avoid animating, use opacity/visibility instead',
  visibility: 'use opacity (0-1)',
  position: 'use transform: translate()',
  zIndex: 'not recommended to animate',
};

export function validateAnimationProps(props: Record<string, unknown>): ValidationResult {
  const safeProps: GPUSafeProperty[] = [];
  const unsafeProps: string[] = [];
  const suggestions: Record<string, string> = {};

  Object.keys(props).forEach((prop) => {
    const normalizedProp = prop.toLowerCase().trim();
    if (GPU_SAFE_PROPERTIES.has(normalizedProp)) {
      safeProps.push(normalizedProp as GPUSafeProperty);
    } else {
      unsafeProps.push(prop);
      suggestions[prop] =
        ALTERNATIVE_SUGGESTIONS[normalizedProp] ??
        `Consider using transform, opacity, or filter for better performance`;
    }
  });

  return {
    valid: unsafeProps.length === 0,
    safeProps,
    unsafeProps,
    suggestions,
  };
}

export function suggestGPUSafeAlternative(prop: string): string {
  const normalizedProp = prop.toLowerCase().trim();
  return (
    ALTERNATIVE_SUGGESTIONS[normalizedProp] ??
    `The property '${prop}' may cause layout reflows. Consider using transform, opacity, or filter instead.`
  );
}

export class WillChangeManager {
  private trackedElements: Map<Element, { properties: Set<string>; timeoutId: ReturnType<typeof setTimeout> }> =
    new Map();
  private defaultCleanupDelay: number = 3000;

  constructor(cleanupDelay?: number) {
    if (cleanupDelay !== undefined) {
      this.defaultCleanupDelay = cleanupDelay;
    }
  }

  applyWillChange(element: Element, properties: string[]): void {
    this.cleanup(element);

    const propertySet = new Set(properties.map((p) => p.toLowerCase()));
    element.setAttribute('will-change', Array.from(propertySet).join(', '));

    const timeoutId = setTimeout(() => {
      this.removeWillChange(element);
    }, this.defaultCleanupDelay);

    this.trackedElements.set(element, { properties: propertySet, timeoutId });
  }

  removeWillChange(element: Element): void {
    const tracked = this.trackedElements.get(element);
    if (tracked) {
      clearTimeout(tracked.timeoutId);
      this.trackedElements.delete(element);
    }
    element.removeAttribute('will-change');
  }

  private cleanup(element: Element): void {
    const existing = this.trackedElements.get(element);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }
  }

  dispose(): void {
    this.trackedElements.forEach((_, element) => {
      this.removeWillChange(element);
    });
    this.trackedElements.clear();
  }

  getTrackedCount(): number {
    return this.trackedElements.size;
  }
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  droppedFrames: number;
  totalFrames: number;
  isHealthy: boolean;
}

export class PerformanceMonitor {
  private frameTimestamps: number[] = [];
  private frameTimes: number[] = [];
  private maxSamples: number = 60;
  private warningThresholdFps: number = 30;
  private criticalThresholdFps: number = 15;
  private onWarning?: (metrics: PerformanceMetrics) => void;
  private onCritical?: (metrics: PerformanceMetrics) => void;

  constructor(options?: {
    maxSamples?: number;
    warningThresholdFps?: number;
    criticalThresholdFps?: number;
    onWarning?: (metrics: PerformanceMetrics) => void;
    onCritical?: (metrics: PerformanceMetrics) => void;
  }) {
    if (options?.maxSamples) this.maxSamples = options.maxSamples;
    if (options?.warningThresholdFps)
      this.warningThresholdFps = options.warningThresholdFps;
    if (options?.criticalThresholdFps)
      this.criticalThresholdFps = options.criticalThresholdFps;
    this.onWarning = options?.onWarning;
    this.onCritical = options?.onCritical;
  }

  recordFrame(timestamp: number = performance.now()): PerformanceMetrics {
    this.frameTimestamps.push(timestamp);

    if (this.frameTimestamps.length > 1) {
      const prevTimestamp = this.frameTimestamps[this.frameTimestamps.length - 2];
      const frameTime = timestamp - prevTimestamp;
      this.frameTimes.push(frameTime);
    } else {
      this.frameTimes.push(16.67);
    }

    while (this.frameTimestamps.length > this.maxSamples) {
      this.frameTimestamps.shift();
      this.frameTimes.shift();
    }

    return this.getMetrics();
  }

  getMetrics(): PerformanceMetrics {
    const totalFrames = this.frameTimes.length;
    if (totalFrames === 0) {
      return {
        fps: 60,
        frameTime: 16.67,
        avgFrameTime: 16.67,
        droppedFrames: 0,
        totalFrames: 0,
        isHealthy: true,
      };
    }

    const totalTime =
      this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0];
    const fps = totalFrames > 1 ? (totalFrames / totalTime) * 1000 : 60;

    const lastFrameTime = this.frameTimes[this.frameTimes.length - 1];
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / totalFrames;

    const expectedFrameTime = 1000 / 60;
    const droppedFrames = this.frameTimes.filter((t) => t > expectedFrameTime * 2).length;

    const isHealthy = fps >= this.warningThresholdFps && droppedFrames < totalFrames * 0.05;

    const metrics: PerformanceMetrics = {
      fps: Math.round(fps * 100) / 100,
      frameTime: Math.round(lastFrameTime * 100) / 100,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      droppedFrames,
      totalFrames,
      isHealthy,
    };

    if (!isHealthy) {
      if (fps <= this.criticalThresholdFps) {
        this.onCritical?.(metrics);
      } else if (fps <= this.warningThresholdFps) {
        this.onWarning?.(metrics);
      }
    }

    return metrics;
  }

  reset(): void {
    this.frameTimestamps = [];
    this.frameTimes = [];
  }

  dispose(): void {
    this.reset();
    this.onWarning = undefined;
    this.onCritical = undefined;
  }
}

export const GPU_SAFE_PROPERTY_LIST: readonly GPUSafeProperty[] = [
  'transform',
  'opacity',
  'filter',
] as const;

export function isGPUSafeProperty(prop: string): boolean {
  return GPU_SAFE_PROPERTIES.has(prop.toLowerCase());
}
