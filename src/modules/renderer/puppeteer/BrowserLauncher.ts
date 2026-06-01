import type { Browser, Page } from 'puppeteer';

export interface BrowserConfig {
  headless?: boolean;
  args?: string[];
  viewport?: { width: number; height: number };
  timeout?: number;
}

export interface BrowserInstance {
  browser: Browser;
  page: Page;
}

export class BrowserLauncher {
  private browserInstance: BrowserInstance | null = null;
  private isBrowserLaunched = false;

  async launch(config: BrowserConfig = {}): Promise<BrowserInstance> {
    if (this.isBrowserLaunched && this.browserInstance) {
      return this.browserInstance;
    }

    const { headless = true, args = [], viewport, timeout = 30000 } = config;

    const defaultArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      ...args,
    ];

    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless,
        args: defaultArgs,
        timeout,
      });

      const page = await browser.newPage();

      if (viewport) {
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: 1,
        });
      }

      this.browserInstance = { browser, page };
      this.isBrowserLaunched = true;

      return this.browserInstance;
    } catch (error) {
      console.error('[BrowserLauncher] 启动浏览器失败:', error);
      throw new Error('Puppeteer 浏览器启动失败。请确保已安装 Chromium。');
    }
  }

  async close(): Promise<void> {
    if (this.browserInstance?.browser) {
      try {
        await this.browserInstance.browser.close();
      } catch (e) {
        console.warn('[BrowserLauncher] 关闭浏览器时出错:', e);
      }
      this.browserInstance = null;
      this.isBrowserLaunched = false;
    }
  }

  async resize(width: number, height: number): Promise<void> {
    if (!this.browserInstance?.page) return;
    await this.browserInstance.page.setViewport({ width, height, deviceScaleFactor: 1 });
  }

  async navigateTo(url: string): Promise<void> {
    if (!this.browserInstance?.page) {
      throw new Error('浏览器未启动');
    }
    await this.browserInstance.page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
  }

  async executeScript<T>(script: string | Function, ...args: any[]): Promise<T> {
    if (!this.browserInstance?.page) {
      throw new Error('浏览器未启动');
    }
    return this.browserInstance.page.evaluate(script as any, ...args);
  }

  isLaunched(): boolean {
    return this.isBrowserLaunched && !!this.browserInstance?.browser?.isConnected?.();
  }
}

const browserLauncher = new BrowserLauncher();
export { browserLauncher };
export default browserLauncher;
