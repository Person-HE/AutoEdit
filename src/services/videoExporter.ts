/**
 * @deprecated 此文件已被 modules/renderer/VideoRenderer.ts 替代
 * @description 旧的视频导出服务，已迁移到新的模块化视频渲染系统
 * @replacement 请使用 src/modules/renderer/VideoRenderer.ts 进行视频导出
 * @migrationDate 2026-04-13
 * @note 文件内容保留以确保向后兼容，新代码请使用新的模块
 */
import { Project, Clip, Asset } from '../types/core';
import { getTemplate } from '../engine/templates';

class RenderEngine {
  private ctx: CanvasRenderingContext2D | null = null;
  private assets: Map<string, HTMLImageElement | HTMLVideoElement> = new Map();

  bindCanvas(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  async loadResources(assets: Asset[]) {
    const loadPromises: Promise<void>[] = [];
    assets.forEach(asset => {
      if (!this.assets.has(asset.id)) {
        if (asset.type === 'image') {
          const promise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => { this.assets.set(asset.id, img); resolve(); };
            img.onerror = () => resolve();
            img.src = asset.url;
          });
          loadPromises.push(promise);
        } else if (asset.type === 'video') {
          const video = document.createElement('video');
          video.src = asset.url;
          video.muted = true;
          video.load();
          this.assets.set(asset.id, video);
        }
      }
    });
    await Promise.all(loadPromises);
  }

  render(project: Project, time: number, assets: Asset[]) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, project.width, project.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, project.width, project.height);

    const visibleClips = Object.values(project.clips || {})
      .filter(clip => {
        const track = project.tracks.find(t => t.id === clip.trackId);
        return track && track.visible && time >= clip.startTime && time < clip.startTime + clip.duration;
      })
      .sort((a, b) => (a.style?.zIndex || 0) - (b.style?.zIndex || 0));

    visibleClips.forEach(clip => {
      let element: HTMLImageElement | HTMLVideoElement | null = null;
      let asset: Asset | undefined;

      if (clip.type !== 'text') {
        asset = assets.find(a => a.id === clip.assetId);
        if (asset) element = this.assets.get(asset.id) || null;
      }

      if (asset && asset.type === 'video' && element) {
        const video = element as HTMLVideoElement;
        const clipTime = time - clip.startTime + (clip.offset || 0);
        if (Math.abs(video.currentTime - clipTime) > 0.2) video.currentTime = clipTime;
      }

      ctx.save();
      const t = clip.transform || { x: 0, y: 0, scale: 1, rotation: 0 };
      ctx.translate(project.width / 2 + (t.x || 0), project.height / 2 + (t.y || 0));
      ctx.rotate((t.rotation || 0) * Math.PI / 180);
      ctx.scale(Math.max(0.001, Math.min(10, t.scale || 1)), Math.max(0.001, Math.min(10, t.scale || 1)));
      ctx.globalAlpha = clip.style?.opacity ?? 1;

      if (clip.type === 'text' && clip.textData) {
        ctx.fillStyle = clip.textData.color || '#ffffff';
        ctx.font = `bold ${clip.textData.fontSize || 60}px ${clip.textData.fontFamily || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(clip.textData.content || '', 0, 0);
      } else if (clip.type === 'template' && clip.templateData) {
        const template = getTemplate(clip.templateData.templateId);
        if (template) {
          const clipRelativeTime = time - clip.startTime;
          const progress = Math.max(0, Math.min(1, clipRelativeTime / clip.duration));
          template.render({ ctx, width: project.width, height: project.height, progress, time: clipRelativeTime, duration: clip.duration, params: clip.templateData.params || {} });
        }
      } else if (element && (asset?.type === 'video' || asset?.type === 'image')) {
        const w = element.width || asset?.width || 1920;
        const h = element.height || asset?.height || 1080;
        if (w > 0 && h > 0) ctx.drawImage(element as CanvasImageSource, -w / 2, -h / 2);
      }
      ctx.restore();
    });
  }
}

export interface ExportConfig {
  fileName: string;
  resolution: '1080p' | '4k';
  format: 'mp4' | 'gif';
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
}

export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private engine: RenderEngine;
  // 新增：用于跟踪导出过程中已经播放过的音频Clip的ID
  private playedAudioClips: Set<string> = new Set();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    this.engine = new RenderEngine();
    this.engine.bindCanvas(this.canvas);
  }

  async exportProject(
    project: Project,
    assets: Asset[],
    config: ExportConfig
  ): Promise<void> {
    const { format, onProgress, onComplete } = config;

    const width = 1920;
    const height = 1080;

    this.canvas.width = width;
    this.canvas.height = height;

    const contentRange = this.calculateContentRange(project);
    const duration = contentRange.end - contentRange.start;
    const fps = project.fps || 30;
    const totalFrames = Math.floor(duration * fps);

    console.log(`Starting export: ${width}x${height}, ${duration}s, ${fps}fps, ${totalFrames} frames`);
    console.log(`Content range: ${contentRange.start}s - ${contentRange.end}s`);

    try {
      await this.engine.loadResources(assets);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 开始导出时清空记录
      this.playedAudioClips.clear();

      if (format === 'gif') {
        await this.exportAsGIF(project, assets, contentRange, config, totalFrames, fps, onProgress, onComplete);
      } else {
        await this.exportAsVideo(project, assets, contentRange, config, totalFrames, fps, onProgress, onComplete);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  private calculateContentRange(project: Project): { start: number; end: number } {
    const clips = Object.values(project.clips || {});

    if (clips.length === 0) {
      return { start: 0, end: 5 };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const clip of clips) {
      const clipEnd = clip.startTime + clip.duration;
      minTime = Math.min(minTime, clip.startTime);
      maxTime = Math.max(maxTime, clipEnd);
    }

    return {
      start: Math.max(0, minTime),
      end: maxTime
    };
  }

  private async exportAsVideo(
    project: Project,
    assets: Asset[],
    contentRange: { start: number; end: number },
    config: ExportConfig,
    totalFrames: number,
    fps: number,
    onProgress?: (progress: number) => void,
    onComplete?: (url: string) => void
  ): Promise<void> {
    const stream = this.canvas.captureStream(fps);

    const audioContext = new AudioContext();
    const audioDestination = audioContext.createMediaStreamDestination();

    const combinedStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks()
    ]);

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 8000000
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = config.fileName + '.webm';
      a.click();

      onComplete?.(url);
    };

    mediaRecorder.start();

    const frameInterval = 1000 / fps;
    const activeAudioNodes: AudioBufferSourceNode[] = [];

    for (let frame = 0; frame <= totalFrames; frame++) {
      const currentTime = contentRange.start + (frame / fps);
      const progress = (frame / totalFrames) * 100;

      onProgress?.(progress);

      const visibleClips = Object.values(project.clips || {}).filter(clip => {
        return currentTime >= clip.startTime &&
               currentTime < clip.startTime + clip.duration;
      });

      if (visibleClips.length > 0) {
        this.engine.render(project, currentTime, assets);
      } else {
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }

      // 播放音频（包括普通音频和配音）
      this.playAudioForCurrentTime(project, assets, currentTime, audioContext, audioDestination, activeAudioNodes);

      await new Promise(resolve => setTimeout(resolve, frameInterval / 2));

      if (frame % Math.floor(fps) === 0) {
        console.log(`Progress: ${Math.round(progress)}%`);
      }
    }

    console.log(`Finished rendering, stopping recorder...`);

    activeAudioNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
    });

    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, 2000);
  }

  private playAudioForCurrentTime(
    project: Project,
    assets: Asset[],
    currentTime: number,
    audioContext: AudioContext,
    destination: AudioNode,
    activeNodes: AudioBufferSourceNode[]
  ): void {
    // 播放普通音频 Clip
    const audioClips = Object.values(project.clips || {}).filter(clip => {
      return clip.type === 'audio' &&
             currentTime >= clip.startTime &&
             currentTime < clip.startTime + clip.duration;
    });

    for (const clip of audioClips) {
      // 检查是否已经为该片段创建过播放节点
      if (!this.playedAudioClips.has(clip.id)) {
        this.playedAudioClips.add(clip.id);
        const asset = assets.find(a => a.id === clip.assetId);
        if (asset && asset.type === 'audio') {
          this.playAudioAsset(asset, clip, currentTime, audioContext, destination, activeNodes);
        }
      }
    }

    // 播放文本配音
    const voiceOverClips = Object.values(project.clips || {}).filter(clip => {
      return clip.type === 'text' &&
             clip.voiceOver?.audioSource &&
             !clip.voiceOver?.linkedClipId &&
             currentTime >= clip.startTime &&
             currentTime < clip.startTime + clip.duration;
    });

    for (const clip of voiceOverClips) {
      // 检查是否已经为该片段创建过配音播放节点
      if (!this.playedAudioClips.has(clip.id)) {
        this.playedAudioClips.add(clip.id);
        if (clip.voiceOver?.audioSource) {
          this.playVoiceOverAsset(clip, currentTime, audioContext, destination, activeNodes);
        }
      }
    }
  }

  private async playAudioAsset(
    asset: Asset,
    clip: Clip,
    currentTime: number,
    audioContext: AudioContext,
    destination: AudioNode,
    activeNodes: AudioBufferSourceNode[]
  ): Promise<void> {
    try {
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destination);

      const offset = (currentTime - clip.startTime);
      source.start(audioContext.currentTime, offset);

      activeNodes.push(source);

      source.onended = () => {
        const index = activeNodes.indexOf(source);
        if (index > -1) {
          activeNodes.splice(index, 1);
        }
      };
    } catch (error) {
      console.error('Failed to play audio asset:', error);
    }
  }

  // 播放配音音频
  private async playVoiceOverAsset(
    clip: Clip,
    currentTime: number,
    audioContext: AudioContext,
    destination: AudioNode,
    activeNodes: AudioBufferSourceNode[]
  ): Promise<void> {
    if (!clip.voiceOver?.audioSource) return;

    try {
      const response = await fetch(clip.voiceOver.audioSource);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destination);

      const offset = (currentTime - clip.startTime);
      source.start(audioContext.currentTime, offset);

      activeNodes.push(source);

      source.onended = () => {
        const index = activeNodes.indexOf(source);
        if (index > -1) {
          activeNodes.splice(index, 1);
        }
      };

      console.log(`Playing voice over for clip ${clip.id} at offset ${offset.toFixed(2)}s`);
    } catch (error) {
      console.error('Failed to play voice over asset:', error);
    }
  }

  private async exportAsGIF(
    project: Project,
    assets: Asset[],
    contentRange: { start: number; end: number },
    config: ExportConfig,
    totalFrames: number,
    fps: number,
    onProgress?: (progress: number) => void,
    onComplete?: (url: string) => void
  ): Promise<void> {
    const gifFrames: ImageData[] = [];

    const sampleInterval = Math.max(1, Math.floor(totalFrames / 60));

    for (let frame = 0; frame < totalFrames; frame += sampleInterval) {
      const currentTime = contentRange.start + (frame / fps);
      const progress = (frame / totalFrames) * 100;

      onProgress?.(progress);

      this.engine.render(project, currentTime, assets);

      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        gifFrames.push(imageData);
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const gifBlob = await this.encodeGIF(gifFrames, this.canvas.width, this.canvas.height, fps);
    const url = URL.createObjectURL(gifBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = config.fileName + '.gif';
    a.click();

    onComplete?.(url);
  }

  private async encodeGIF(
    frames: ImageData[],
    width: number,
    height: number,
    fps: number
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const gif = {
        width,
        height,
        frames: frames.map(frame => {
          ctx.putImageData(frame, 0, 0);
          return canvas.toDataURL('image/jpeg', 0.8);
        })
      };

      const json = JSON.stringify(gif);
      const blob = new Blob([json], { type: 'application/json' });
      resolve(blob);
    });
  }
}

export const videoExporter = new VideoExporter();
