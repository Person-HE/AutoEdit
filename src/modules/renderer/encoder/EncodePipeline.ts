import { FFmpegEncoder, EncodeConfig } from './FFmpegEncoder';
import * as fs from 'fs';

export type EncodeStage =
  | 'validating'
  | 'encoding-video'
  | 'mixing-audio'
  | 'finalizing'
  | 'completed';

export interface PipelineInput {
  framesDir: string;
  frameCount: number;
  fps: number;
  width: number;
  height: number;
  audioPath?: string;
  duration?: number;
}

export interface PipelineOutput {
  outputPath: string;
  fileSize: number;
  duration: number;
  bitrate: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PipelineCallbacks {
  onStageChange?: (stage: EncodeStage) => void;
  onProgress?: (progress: number) => void;
  onComplete?: (output: PipelineOutput) => void;
  onError?: (error: Error) => void;
}

class EncodePipeline {
  private encoder: FFmpegEncoder;
  private currentStage: EncodeStage = 'validating';
  private currentProgress = 0;
  private _cancelled = false;

  constructor(encoder?: FFmpegEncoder) {
    this.encoder = encoder || new FFmpegEncoder();
  }

  async run(
    input: PipelineInput,
    outputConfig: { outputPath: string; encodeConfig?: EncodeConfig },
    callbacks?: PipelineCallbacks
  ): Promise<PipelineOutput> {
    this._cancelled = false;
    this.currentProgress = 0;

    try {
      const availability = await this.encoder.checkAvailability();
      if (!availability.available) {
        throw new Error(
          `FFmpeg is not available. Please install FFmpeg and ensure it is in your system PATH.\n` +
          `You can download it from https://ffmpeg.org/download.html`
        );
      }

      const validation = this.validateInput(input);
      if (!validation.valid) {
        throw new Error(`Validation failed:\n${validation.errors.join('\n')}`);
      }

      validation.warnings.forEach((w) => console.warn(`[EncodePipeline] Warning: ${w}`));

      this.setStage('validating', callbacks);
      this.setProgress(0, callbacks);

      this.setStage('encoding-video', callbacks);
      this.setProgress(5, callbacks);

      const encodeConfig: EncodeConfig = {
        ...outputConfig.encodeConfig,
        framerate: outputConfig.encodeConfig?.framerate ?? input.fps,
        resolution: outputConfig.encodeConfig?.resolution ?? {
          width: input.width,
          height: input.height,
        },
      };

      if (input.audioPath && fs.existsSync(input.audioPath)) {
        this.setStage('mixing-audio', callbacks);
        await this.encoder.encodeWithAudio(
          input.framesDir,
          input.audioPath,
          outputConfig.outputPath,
          encodeConfig,
          (progress) => {
            if (this._cancelled) return;
            this.setProgress(5 + progress * 0.85, callbacks);
          }
        );
      } else {
        await this.encoder.encode(
          input.framesDir,
          outputConfig.outputPath,
          encodeConfig,
          (progress) => {
            if (this._cancelled) return;
            this.setProgress(5 + progress * 0.85, callbacks);
          }
        );
      }

      if (this._cancelled) {
        throw new Error('Encoding was cancelled');
      }

      this.setStage('finalizing', callbacks);
      this.setProgress(95, callbacks);

      const outputStats = await this.verifyOutput(outputConfig.outputPath, input.duration);

      this.setStage('completed', callbacks);
      this.setProgress(100, callbacks);

      const result: PipelineOutput = {
        outputPath: outputConfig.outputPath,
        fileSize: outputStats.fileSize,
        duration: outputStats.duration,
        bitrate: outputStats.bitrate,
      };

      callbacks?.onComplete?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(err);
      throw err;
    }
  }

  validateInput(input: PipelineInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fs.existsSync(input.framesDir)) {
      errors.push(`Frames directory does not exist: ${input.framesDir}`);
    } else {
      const files = fs.readdirSync(input.framesDir).filter((f) =>
        f.startsWith('frame_') && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
      );

      if (files.length === 0) {
        errors.push(`No frame images found in directory: ${input.framesDir}. Expected pattern: frame_XXXXXX.png`);
      } else if (input.frameCount > 0 && files.length < input.frameCount) {
        warnings.push(
          `Expected ${input.frameCount} frames but found only ${files.length}. Output may be incomplete.`
        );
      }
    }

    if (input.fps <= 0) {
      errors.push(`Invalid FPS value: ${input.fps}. Must be greater than 0.`);
    }

    if (input.width <= 0 || input.height <= 0) {
      errors.push(`Invalid resolution: ${input.width}x${input.height}. Both dimensions must be greater than 0.`);
    }

    if (input.audioPath && !fs.existsSync(input.audioPath)) {
      warnings.push(`Audio file not found: ${input.audioPath}. Encoding will proceed without audio.`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  estimateOutputSize(input: PipelineInput, config: EncodeConfig = {}): number {
    const fps = config.framerate ? Number(config.framerate) : input.fps;
    const duration = input.duration ?? (input.frameCount / fps);
    const width = config.resolution?.width ?? input.width;
    const height = config.resolution?.height ?? input.height;

    const bitrateMbps = config.bitrate
      ? parseFloat(config.bitrate) / (config.bitrate.includes('k') ? 1000 : 1)
      : this.estimateBitrateFromCRF(config.crf ?? 23);

    const estimatedSizeBytes = bitrateMbps * 1024 * 1024 * duration * 1.05;
    return Math.round(estimatedSizeBytes);
  }

  cancel(): void {
    this._cancelled = true;
    this.encoder.cancel();
  }

  getProgress(): { stage: EncodeStage; progress: number } {
    return {
      stage: this.currentStage,
      progress: this.currentProgress,
    };
  }

  private async verifyOutput(outputPath: string, expectedDuration?: number): Promise<{
    fileSize: number;
    duration: number;
    bitrate: string;
  }> {
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file was not created: ${outputPath}`);
    }

    const stats = fs.statSync(outputPath);
    const fileSize = stats.size;

    if (fileSize === 0) {
      throw new Error(`Output file is empty: ${outputPath}`);
    }

    const duration = expectedDuration ?? 0;
    const bitrate = duration > 0
      ? `${Math.round((fileSize * 8) / duration / 1000)}k`
      : 'unknown';

    return { fileSize, duration, bitrate };
  }

  private setStage(stage: EncodeStage, callbacks?: PipelineCallbacks): void {
    this.currentStage = stage;
    callbacks?.onStageChange?.(stage);
  }
  
  private setProgress(progress: number, callbacks?: PipelineCallbacks): void {
    this.currentProgress = Math.min(Math.max(progress, 0), 100);
    callbacks?.onProgress?.(this.currentProgress);
  }

  private estimateBitrateFromCRF(crf: number): number {
    if (crf <= 18) return 15;
    if (crf <= 23) return 8;
    if (crf <= 28) return 4;
    return 2;
  }
}

export const encodePipeline = new EncodePipeline();
export default EncodePipeline;
