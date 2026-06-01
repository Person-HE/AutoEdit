import type { Page } from 'puppeteer';

export interface FrameDriverOptions {
  framePropertyName?: string;
  eventName?: string;
  renderReadyProperty?: string;
}

const DEFAULT_OPTIONS: Required<FrameDriverOptions> = {
  framePropertyName: '__currentFrame',
  eventName: 'framechange',
  renderReadyProperty: '__frameRendered',
};

class FrameDriver {
  private options: Required<FrameDriverOptions>;

  constructor(options: FrameDriverOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async setFrame(page: Page, frameNumber: number): Promise<void> {
    try {
      await page.evaluate(
        ({ frameNum, prop, event }) => {
          (window as any)[prop] = frameNum;
          (window as any)[event.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')] = 
            new CustomEvent(event);
          window.dispatchEvent(new CustomEvent(event));
        },
        {
          frameNum: frameNumber,
          prop: this.options.framePropertyName,
          event: this.options.eventName,
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to set frame ${frameNumber}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async waitForRender(page: Page, timeout: number = 5000): Promise<boolean> {
    try {
      await Promise.race([
        page.waitForFunction(
          (prop) => (window as any)[prop] === true,
          { timeout },
          this.options.renderReadyProperty
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Frame render wait timed out after ${timeout}ms`)), timeout)
        ),
      ]);

      return true;
    } catch (error) {
      console.warn(`Frame render did not complete within ${timeout}ms`);
      return false;
    }
  }

  async injectDriverScript(page: Page): Promise<void> {
    const scriptContent = `
      (function() {
        if (window.${this.options.framePropertyName} === undefined) {
          Object.defineProperty(window, '${this.options.framePropertyName}', {
            value: 0,
            writable: true,
            configurable: true,
          });
        }
        
        if (window.${this.options.renderReadyProperty} === undefined) {
          Object.defineProperty(window, '${this.options.renderReadyProperty}', {
            value: false,
            writable: true,
            configurable: true,
          });
        }
        
        window.addEventListener('${this.options.eventName}', function() {
          // Frame change handler - React components should listen for this
          console.log('[FrameDriver] Frame changed to:', window.${this.options.framePropertyName});
        });
        
        console.log('[FrameDriver] Driver script injected successfully');
      })();
    `;

    try {
      await page.evaluate(scriptContent);
    } catch (error) {
      throw new Error(
        `Failed to inject driver script: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getOptions(): Readonly<Required<FrameDriverOptions>> {
    return { ...this.options };
  }

  static createDriver(options?: FrameDriverOptions): FrameDriver {
    return new FrameDriver(options);
  }
}

export { FrameDriver };
export default FrameDriver;
