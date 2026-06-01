import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Page } from 'puppeteer';
import { FrameDriver } from './FrameDriver';
import type { BrowserInstance } from './BrowserLauncher';

export interface CaptureOptions {
  outputDir?: string;
  filePrefix?: string;
  fileFormat?: 'png' | 'jpeg';
  quality?: number;
  padding?: number;
}

export interface CaptureConfig {
  startFrame: number;
  endFrame: number;
  fps?: number;
  onProgress?: (currentFrame: number, totalFrames: number) => void;
}

export interface CaptureResult {
  framesDir: string;
  totalFrames: number;
  framePaths: string[];
}

const DEFAULT_OPTIONS: Required<CaptureOptions> = {
  outputDir: path.join(os.tmpdir(), 'autoedit_frames'),
  filePrefix: 'frame_',
  fileFormat: 'png',
  quality: 90,
  padding: 5,
};

class FrameCapture {
  private options: Required<CaptureOptions>;
  private frameDriver: FrameDriver;

  constructor(options: CaptureOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.frameDriver = FrameDriver.createDriver();
  }

  async captureFrame(
    page: Page,
    frameNumber: number,
    options?: Partial<CaptureOptions>
  ): Promise<string> {
    const mergedOptions = { ...this.options, ...options };
    
    try {
      await this.ensureOutputDirectory(mergedOptions.outputDir);
      
      await this.frameDriver.setFrame(page, frameNumber);
      const renderComplete = await this.frameDriver.waitForRender(page);
      
      if (!renderComplete) {
        console.warn(`Frame ${frameNumber} may not have fully rendered`);
      }

      const framePath = this.getFramePath(mergedOptions.outputDir, frameNumber, mergedOptions);
      
      await page.screenshot({
        path: framePath,
        type: mergedOptions.fileFormat,
        quality: mergedOptions.fileFormat === 'jpeg' ? mergedOptions.quality : undefined,
        fullPage: false,
      });

      return framePath;
    } catch (error) {
      throw new Error(
        `Failed to capture frame ${frameNumber}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async captureAll(
    browserInstance: BrowserInstance,
    config: CaptureConfig
  ): Promise<CaptureResult> {
    const { page } = browserInstance;
    const { startFrame, endFrame, onProgress } = config;
    const totalFrames = endFrame - startFrame + 1;
    const framePaths: string[] = [];

    await this.ensureOutputDirectory(this.options.outputDir);

    for (let frame = startFrame; frame <= endFrame; frame++) {
      try {
        const framePath = await this.captureFrame(page, frame);
        framePaths.push(framePath);
        
        onProgress?.(frame - startFrame + 1, totalFrames);
      } catch (error) {
        console.error(`Error capturing frame ${frame}:`, error);
        throw new Error(
          `Failed to capture frame ${frame} of ${totalFrames}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      framesDir: this.options.outputDir,
      totalFrames: framePaths.length,
      framePaths,
    };
  }

  async cleanup(framesDir?: string): Promise<void> {
    const targetDir = framesDir ?? this.options.outputDir;

    if (!fs.existsSync(targetDir)) {
      console.log(`Cleanup: Directory ${targetDir} does not exist, nothing to clean.`);
      return;
    }

    try {
      const files = fs.readdirSync(targetDir);
      
      for (const file of files) {
        const filePath = path.join(targetDir, file);
        
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isFile()) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.warn(`Failed to delete file ${filePath}:`, fileError);
        }
      }

      try {
        fs.rmdirSync(targetDir);
        console.log(`Successfully cleaned up directory: ${targetDir}`);
      } catch (rmdirError) {
        console.warn(`Failed to remove directory ${targetDir}:`, rmdirError);
      }
    } catch (error) {
      throw new Error(
        `Failed to cleanup frames directory ${targetDir}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getFramePath(
    framesDir: string,
    frameNumber: number,
    options?: Partial<CaptureOptions>
  ): string {
    const mergedOptions = { ...this.options, ...options };
    const paddedFrame = String(frameNumber).padStart(mergedOptions.padding, '0');
    const extension = mergedOptions.fileFormat === 'jpeg' ? 'jpg' : mergedOptions.fileFormat;
    
    return path.join(framesDir, `${mergedOptions.filePrefix}${paddedFrame}.${extension}`);
  }

  private async ensureOutputDirectory(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  getOutputDirectory(): string {
    return this.options.outputDir;
  }

  getFrameDriver(): FrameDriver {
    return this.frameDriver;
  }

  static createCapture(options?: CaptureOptions): FrameCapture {
    return new FrameCapture(options);
  }
}

export { FrameCapture };
export default FrameCapture;
