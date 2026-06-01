import fs from 'fs';
import path from 'path';
import os from 'os';
import { BrowserLauncher, type BrowserInstance } from './puppeteer/BrowserLauncher';
import { FrameCapture, type CaptureOptions, type CaptureConfig } from './puppeteer/FrameCapture';
import { FFmpegEncoder, type EncodeConfig } from './encoder/FFmpegEncoder';

export interface RenderOptions {
  entryPoint: string;
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames: number;
  codec?: string;
  crf?: number;
  format?: string;
  audioPath?: string;
  onProgress?: (progress: RenderProgress) => void;
  onComplete?: (result: RenderResult) => void;
  onError?: (error: Error) => void;
}

export interface RenderProgress {
  stage: 'launching' | 'capturing' | 'encoding' | 'finalizing';
  currentFrame?: number;
  totalFrames?: number;
  percent: number;
  message: string;
}

export interface RenderResult {
  success: boolean;
  outputPath: string;
  fileSize: number;
  duration: number;
  totalFrames: number;
  renderTime: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const DEFAULT_OPTIONS = {
  width: 1920,
  height: 1080,
  fps: 30,
  codec: 'libx264',
  crf: 23,
  format: 'mp4',
};

class VideoRenderer {
  private launcher: BrowserLauncher | null = null;
  private capture: FrameCapture | null = null;
  private isCancelled: boolean = false;
  private tempDir: string | null = null;

  async render(options: RenderOptions): Promise<RenderResult> {
    const startTime = Date.now();
    const config = { ...DEFAULT_OPTIONS, ...options };
    this.isCancelled = false;

    try {
      const validation = this.validateOptions(options);
      if (!validation.valid) {
        throw new Error(`Invalid options: ${validation.errors.join(', ')}`);
      }

      this.tempDir = await this.createTempDirectory();

      config.onProgress?.({
        stage: 'launching',
        percent: 0,
        message: '正在启动浏览器...',
      });

      this.launcher = new BrowserLauncher();
      const browserInstance = await this.launcher.launch({ headless: true });
      const { page } = browserInstance;
      await page.setViewport({ width: config.width!, height: config.height! });

      if (this.checkCancelled()) throw new Error('渲染已取消');

      const isFileUrl = config.entryPoint.startsWith('file://') || fs.existsSync(config.entryPoint);
      const url = isFileUrl ? `file://${path.resolve(config.entryPoint)}` : config.entryPoint;

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      config.onProgress?.({
        stage: 'capturing',
        percent: 5,
        totalFrames: config.durationInFrames,
        message: '开始捕获帧...',
      });

      this.capture = new FrameCapture({
        outputDir: this.tempDir,
        fileFormat: 'png',
        quality: 100,
      });

      const captureConfig: CaptureConfig = {
        startFrame: 0,
        endFrame: config.durationInFrames - 1,
        fps: config.fps,
        onProgress: (currentFrame: number, totalFrames: number) => {
          config.onProgress?.({
            stage: 'capturing',
            currentFrame,
            totalFrames,
            percent: 5 + (currentFrame / totalFrames) * 50,
            message: `捕获帧 ${currentFrame}/${totalFrames}`,
          });
        },
      };

      await this.capture.captureAll(browserInstance, captureConfig);

      if (this.checkCancelled()) throw new Error('渲染已取消');

      config.onProgress?.({
        stage: 'encoding',
        percent: 55,
        message: '开始编码视频...',
      });

      const outputDir = path.dirname(config.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const encoder = new FFmpegEncoder();
      const encodeConfig: EncodeConfig = {
        codec: config.codec,
        crf: config.crf,
        framerate: config.fps,
        resolution: { width: config.width!, height: config.height! },
      };

      await encoder.encode(this.tempDir!, config.outputPath, encodeConfig, (progress) => {
        config.onProgress?.({
          stage: 'encoding',
          percent: 55 + progress * 40,
          message: `编码中... ${Math.round(progress * 100)}%`,
        });
      });

      if (config.audioPath && fs.existsSync(config.audioPath)) {
        await this.mergeAudio(config.outputPath, config.audioPath, config.fps!);
      }

      config.onProgress?.({
        stage: 'finalizing',
        percent: 95,
        message: '完成渲染...',
      });

      const renderTime = Date.now() - startTime;
      const stats = fs.statSync(config.outputPath);

      const result: RenderResult = {
        success: true,
        outputPath: config.outputPath,
        fileSize: stats.size,
        duration: config.durationInFrames / config.fps!,
        totalFrames: config.durationInFrames,
        renderTime,
      };

      config.onComplete?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      config.onError?.(err);
      return {
        success: false,
        outputPath: config.outputPath,
        fileSize: 0,
        duration: 0,
        totalFrames: 0,
        renderTime: Date.now() - startTime,
      };
    } finally {
      await this.cleanup();
    }
  }

  async renderStill(options: Omit<RenderOptions, 'durationInFrames' | 'outputPath'> & { frame?: number; outputPath: string }): Promise<string> {
    const config = { ...DEFAULT_OPTIONS, ...options, frame: options.frame ?? 0 };

    try {
      this.launcher = new BrowserLauncher();
      const browserInstance = await this.launcher.launch({ headless: true });
      const { page } = browserInstance;
      await page.setViewport({ width: config.width!, height: config.height! });

      const isFileUrl = config.entryPoint.startsWith('file://') || fs.existsSync(config.entryPoint);
      const url = isFileUrl ? `file://${path.resolve(config.entryPoint)}` : config.entryPoint;

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      this.capture = new FrameCapture({
        outputDir: path.dirname(config.outputPath),
        fileFormat: 'png',
        quality: 100,
      });

      await this.capture.captureFrame(page, config.frame!);

      await this.cleanup();
      return config.outputPath;
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  cancel(): void {
    this.isCancelled = true;
  }

  validateOptions(options: Partial<RenderOptions>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.entryPoint) {
      errors.push('entryPoint 是必需的');
    }
    if (!options.outputPath) {
      errors.push('outputPath 是必需的');
    }
    if (!options.durationInFrames || options.durationInFrames <= 0) {
      errors.push('durationInFrames 必须大于 0');
    }
    if (options.width && (options.width < 1 || options.width > 7680)) {
      errors.push('width 必须在 1-7680 之间');
    }
    if (options.height && (options.height < 1 || options.height > 4320)) {
      errors.push('height 必须在 1-4320 之间');
    }
    if (options.fps && (options.fps < 1 || options.fps > 120)) {
      errors.push('fps 必须在 1-120 之间');
    }
    if (options.crf && (options.crf < 0 || options.crf > 51)) {
      errors.push('crf 必须在 0-51 之间');
    }
    if (options.durationInFrames && options.durationInFrames > 36000) {
      warnings.push(`durationInFrames (${options.durationInFrames}) 非常大，可能需要较长时间`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getEstimatedTime(options: Partial<RenderOptions>): number {
    const fps = options.fps ?? DEFAULT_OPTIONS.fps;
    const frames = options.durationInFrames ?? 30;
    const captureTimePerFrame = 150;
    const encodeTimePerFrame = 20;
    const overhead = 5000;

    return (frames * (captureTimePerFrame + encodeTimePerFrame)) + overhead;
  }

  private async createTempDirectory(): Promise<string> {
    const tempDir = path.join(os.tmpdir(), `remotion-render-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  private checkCancelled(): boolean {
    return this.isCancelled;
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.launcher) {
        await this.launcher.close();
        this.launcher = null;
      }
      this.capture = null;

      if (this.tempDir && fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.tempDir, file));
        }
        fs.rmdirSync(this.tempDir);
        this.tempDir = null;
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  private async mergeAudio(videoPath: string, audioPath: string, fps: number): Promise<void> {
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileAsync = promisify(execFile);
    const tempOutput = videoPath.replace(/\.[^.]+$/, '_temp.mp4');

    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-i', videoPath,
        '-i', audioPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        tempOutput,
      ]);

      fs.unlinkSync(videoPath);
      fs.renameSync(tempOutput, videoPath);
    } catch (error) {
      console.warn('Audio merge failed, video without audio:', error);
      if (fs.existsSync(tempOutput)) {
        fs.unlinkSync(tempOutput);
      }
    }
  }
}

export default VideoRenderer;
export { VideoRenderer };
