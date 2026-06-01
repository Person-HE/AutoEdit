import type ffmpeg from 'fluent-ffmpeg';

export interface VideoCodec {
  name: string;
  label: string;
  defaultCRF: number;
  supportedFormats: string[];
}

export interface EncodeConfig {
  codec?: VideoCodec | string;
  crf?: number;
  bitrate?: string;
  preset?: string;
  pixelFormat?: string;
  framerate?: number | string;
  resolution?: { width: number; height: number };
  audioCodec?: string;
  audioBitrate?: string;
  additionalOptions?: string[];
}

export interface OutputFormat {
  extension: string;
  mimeType: string;
  container: string;
}

export class FFmpegEncoder {
  private _cancelled = false;

  getFFmpegPath(): string {
    return 'ffmpeg';
  }

  async checkAvailability(): Promise<{ available: boolean; version?: string }> {
    try {
      const { execSync } = await import('child_process');
      const version = execSync('ffmpeg -version', { encoding: 'utf-8', timeout: 5000 });
      const match = version.match(/ffmpeg version (\S+)/);
      return { available: true, version: match ? match[1] : 'unknown' };
    } catch {
      return { available: false };
    }
  }

  getSupportedCodecs(): VideoCodec[] {
    return [
      { name: 'libx264', label: 'H.264 (AVC)', defaultCRF: 23, supportedFormats: ['mp4', 'mkv', 'mov'] },
      { name: 'libx265', label: 'H.265 (HEVC)', defaultCRF: 28, supportedFormats: ['mp4', 'mkv'] },
      { name: 'libvpx-vp9', label: 'VP9', defaultCRF: 31, supportedFormats: ['webm', 'mkv'] },
      { name: 'libaom-av1', label: 'AV1', defaultCRF: 30, supportedFormats: ['mp4', 'webm', 'mkv'] },
    ];
  }

  getSupportedFormats(): OutputFormat[] {
    return [
      { extension: '.mp4', mimeType: 'video/mp4', container: 'mp4' },
      { extension: '.webm', mimeType: 'video/webm', container: 'webm' },
      { extension: '.mkv', mimeType: 'video/x-matroska', container: 'matroska' },
      { extension: '.mov', mimeType: 'video/quicktime', container: 'mov' },
    ];
  }

  getDefaultConfigs(): Record<string, EncodeConfig> {
    return {
      '1080p': { codec: 'libx264', crf: 23, preset: 'medium', pixelFormat: 'yuv420p', framerate: 30, resolution: { width: 1920, height: 1080 }, audioCodec: 'aac', audioBitrate: '128k' },
      '4k': { codec: 'libx264', crf: 20, preset: 'slow', pixelFormat: 'yuv420p', framerate: 30, resolution: { width: 3840, height: 2160 }, audioCodec: 'aac', audioBitrate: '320k' },
      'high-quality': { codec: 'libx264', crf: 18, preset: 'slow', pixelFormat: 'yuv420p', framerate: 60, resolution: { width: 1920, height: 1080 }, audioCodec: 'aac', audioBitrate: '256k' },
      'small-size': { codec: 'libx264', crf: 28, preset: 'veryfast', pixelFormat: 'yuv420p', framerate: 24, resolution: { width: 1280, height: 720 }, audioCodec: 'aac', audioBitrate: '96k' },
    };
  }

  cancel(): void {
    this._cancelled = true;
  }

  async encode(
    imageSequenceDir: string,
    outputPath: string,
    config?: EncodeConfig,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    this._cancelled = false;
    const ffmpegModule = await import('fluent-ffmpeg');
    const ffmpeg = ffmpegModule.default || ffmpegModule;
    return new Promise((resolve, reject) => {
      const cmd = ffmpeg()
        .input(`${imageSequenceDir}/frame_%05d.png`)
        .inputFPS(Number(config?.framerate ?? 30))
        .videoCodec(typeof config?.codec === 'string' ? config.codec : (config?.codec as VideoCodec)?.name ?? 'libx264')
        .outputOptions([
          `-crf ${config?.crf ?? 23}`,
          `-preset ${config?.preset ?? 'medium'}`,
          `-pix_fmt ${config?.pixelFormat ?? 'yuv420p'}`,
          ...(config?.additionalOptions ?? []),
        ])
        .output(outputPath)
        .on('progress', (progress: any) => {
          if (this._cancelled) {
            cmd.kill('SIGKILL');
            return;
          }
          const percent = progress.percent ?? 0;
          onProgress?.(Math.min(100, percent));
        })
        .on('end', () => {
          onProgress?.(100);
          resolve();
        })
        .on('error', (err: Error) => {
          if (this._cancelled) {
            reject(new Error('编码已取消'));
          } else {
            reject(err);
          }
        });
      cmd.run();
    });
  }

  async encodeWithAudio(
    imageSequenceDir: string,
    audioPath: string,
    outputPath: string,
    config?: EncodeConfig,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    this._cancelled = false;
    const ffmpegModule = await import('fluent-ffmpeg');
    const ffmpeg = ffmpegModule.default || ffmpegModule;
    return new Promise((resolve, reject) => {
      const cmd = ffmpeg()
        .input(`${imageSequenceDir}/frame_%05d.png`)
        .inputFPS(Number(config?.framerate ?? 30))
        .input(audioPath)
        .videoCodec(typeof config?.codec === 'string' ? config.codec : (config?.codec as VideoCodec)?.name ?? 'libx264')
        .audioCodec(config?.audioCodec ?? 'aac')
        .audioBitrate(config?.audioBitrate ?? '128k')
        .outputOptions([
          `-crf ${config?.crf ?? 23}`,
          `-preset ${config?.preset ?? 'medium'}`,
          `-pix_fmt ${config?.pixelFormat ?? 'yuv420p'}`,
          ...(config?.additionalOptions ?? []),
        ])
        .output(outputPath)
        .on('progress', (progress: any) => {
          if (this._cancelled) {
            cmd.kill('SIGKILL');
            return;
          }
          const percent = progress.percent ?? 0;
          onProgress?.(Math.min(100, percent));
        })
        .on('end', () => {
          onProgress?.(100);
          resolve();
        })
        .on('error', (err: Error) => {
          if (this._cancelled) {
            reject(new Error('编码已取消'));
          } else {
            reject(err);
          }
        });
      cmd.run();
    });
  }
}

const ffMpegEncoder = new FFmpegEncoder();
export { ffMpegEncoder };
export default ffMpegEncoder;
