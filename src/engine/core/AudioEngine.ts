import { Project, Asset, Clip } from '../../types/core';
import { sourceElapsed, instantSpeed, normalizePoints } from '../timing/speedCurve';

interface ActiveVoice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * WebAudio 播放引擎：
 * - 每个活动片段独立 GainNode（支持 clip.volume 0–2 与音频淡入淡出）
 * - clip.speed 通过 playbackRate 实现（源偏移与剩余时长按速度换算）
 * - 每帧 sync 仅做一次全量扫描；漂移超过阈值才整体重建
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sources: Map<string, ActiveVoice> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  private voiceOverBuffers: Map<string, AudioBuffer> = new Map();
  private masterGain: GainNode | null = null;
  private lastSyncTime: number = -1;
  private loadedUrls: Set<string> = new Set();
  private pendingLoads: Set<string> = new Set();

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  async loadAudio(url: string, assetId: string): Promise<void> {
    if (!this.audioContext) return;
    if (this.buffers.has(assetId)) return;
    if (this.loadedUrls.has(url) || this.pendingLoads.has(url)) return;

    // 发起请求前先标记，防止 Request Flood
    this.loadedUrls.add(url);
    this.pendingLoads.add(url);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) return;

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(assetId, audioBuffer);
    } catch (error) {
      console.error(`Failed to load audio asset ${assetId}:`, error);
    } finally {
      this.pendingLoads.delete(url);
    }
  }

  async loadVoiceOverAudio(clipId: string, audioUrl: string): Promise<void> {
    if (!this.audioContext) return;
    if (this.voiceOverBuffers.has(clipId)) return;
    if (this.loadedUrls.has(audioUrl) || this.pendingLoads.has(audioUrl)) return;

    this.loadedUrls.add(audioUrl);
    this.pendingLoads.add(audioUrl);

    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch voice over: ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) return;

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.voiceOverBuffers.set(clipId, audioBuffer);
    } catch (error) {
      console.error(`Failed to load voice over for clip ${clipId}:`, error);
    } finally {
      this.pendingLoads.delete(audioUrl);
    }
  }

  async loadResources(assets: Asset[]): Promise<void> {
    const loadPromises = assets
      .filter(a => a.type === 'audio' && a.url)
      .map(asset => this.loadAudio(asset.url, asset.id));
    await Promise.all(loadPromises);
  }

  /** 计算片内相对时间处的音量包络（含淡入淡出） */
  private static envelopeAt(clip: Clip, relSecs: number): number {
    const dur = Math.max(0.001, clip.duration);
    const fin = Math.max(0, clip.audioFadeIn ?? 0);
    const fout = Math.max(0, clip.audioFadeOut ?? 0);
    let env = 1;
    if (fin > 0) env *= clamp01(relSecs / fin);
    if (fout > 0) env *= clamp01((dur - relSecs) / fout);
    return clamp01(env);
  }

  private startClipPlayback(
    clip: Clip,
    buffer: AudioBuffer,
    mode: 'audio' | 'voiceover',
    currentTime: number
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    const pts = normalizePoints(clip.speedCurve);
    const baseSpeed = mode === 'voiceover'
      ? 1
      : Math.max(0.25, Math.min(4, clip.speed ?? 1));
    const rel = currentTime - clip.startTime;

    // 源内偏移（秒）：曲线片段用解析积分，恒速片段线性换算
    let srcOffset: number;
    let rateNow: number;
    if (mode === 'voiceover') {
      srcOffset = rel;
      rateNow = 1;
    } else if (pts) {
      srcOffset = sourceElapsed(clip, rel);
      rateNow = Math.max(0.05, Math.min(16, instantSpeed(pts, rel / Math.max(0.001, clip.duration), baseSpeed)));
    } else {
      srcOffset = rel * baseSpeed + (clip.offset ?? 0);
      rateNow = baseSpeed;
    }

    if (srcOffset < 0 || srcOffset >= buffer.duration) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    try { source.playbackRate.value = rateNow; } catch { /* 超出浏览器支持范围则保持默认 */ }

    const gain = this.audioContext.createGain();
    source.connect(gain);
    gain.connect(this.masterGain);

    const clipRemaining = clip.duration - rel;
    // 剩余时长以当前瞬时速率近似（sync 每 0.1s 会自动重排，误差自校正）
    const bufferRemaining = (buffer.duration - srcOffset) / rateNow;
    const duration = Math.min(clipRemaining, bufferRemaining);
    if (duration <= 0) return;

    // 音量基础值 + 包络（当前点即时值；未过的关键点用绝对时间排程）
    const vol = Math.max(0, Math.min(2, clip.volume ?? 1));
    const now = this.audioContext.currentTime;
    const g = gain.gain;
    g.cancelScheduledValues(now);
    g.value = AudioEngine.envelopeAt(clip, rel) * vol;

    const fin = Math.max(0, clip.audioFadeIn ?? 0);
    const fout = Math.max(0, clip.audioFadeOut ?? 0);
    if (fin > 0 && rel < fin) {
      g.setValueAtTime(AudioEngine.envelopeAt(clip, rel) * vol, now);
      g.linearRampToValueAtTime(vol, now + (fin - rel));
    }
    if (fout > 0) {
      const fadeOutStart = clip.duration - fout;
      if (rel < fadeOutStart) {
        g.setValueAtTime(vol, now + (fadeOutStart - rel));
        g.linearRampToValueAtTime(0, now + (clip.duration - rel));
      } else {
        g.linearRampToValueAtTime(0, now + Math.max(0, clip.duration - rel));
      }
    }

    // start 的 duration 参数以 buffer 时间计：项目剩余秒 × 当前速率换算回源时间
    source.start(0, srcOffset, duration * rateNow);

    this.sources.set(clip.id, { source, gain });
    source.onended = () => {
      try { gain.disconnect(); } catch {}
      this.sources.delete(clip.id);
    };
  }

  sync(currentTime: number, isPlaying: boolean, project: Project): void {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 单次扫描收集活动片段
    const activeAudioClips: Clip[] = [];
    const voiceOverClips: Clip[] = [];
    const clips = Object.values(project.clips || {});
    for (const clip of clips) {
      if (currentTime < clip.startTime || currentTime >= clip.startTime + clip.duration) continue;
      if (clip.type === 'audio') activeAudioClips.push(clip);
      else if (clip.type === 'text' && clip.voiceOver?.audioSource && !clip.voiceOver?.linkedClipId) voiceOverClips.push(clip);
    }

    // 预加载配音（幂等，命中缓存即返回）
    for (const clip of voiceOverClips) {
      if (clip.voiceOver?.audioSource) this.loadVoiceOverAudio(clip.id, clip.voiceOver.audioSource);
    }

    // 停止不再活动或暂停状态的源
    this.sources.forEach((voice, clipId) => {
      const stillActive =
        isPlaying &&
        (activeAudioClips.some(c => c.id === clipId) || voiceOverClips.some(c => c.id === clipId));
      if (!stillActive) {
        try { voice.source.stop(); } catch {}
        try { voice.gain.disconnect(); } catch {}
        this.sources.delete(clipId);
      }
    });

    if (!isPlaying) {
      this.lastSyncTime = -1;
      return;
    }

    // 漂移超阈值时全部重建（擦洗、跳转）
    if (Math.abs(currentTime - this.lastSyncTime) > 0.1) {
      this.sources.forEach(voice => {
        try { voice.source.stop(); } catch {}
        try { voice.gain.disconnect(); } catch {}
      });
      this.sources.clear();
    }

    for (const clip of activeAudioClips) {
      if (this.sources.has(clip.id)) continue;
      const buffer = this.buffers.get(clip.assetId);
      if (buffer) this.startClipPlayback(clip, buffer, 'audio', currentTime);
    }

    for (const clip of voiceOverClips) {
      if (this.sources.has(clip.id)) continue;
      const buffer = this.voiceOverBuffers.get(clip.id);
      if (buffer) this.startClipPlayback(clip, buffer, 'voiceover', currentTime);
    }

    this.lastSyncTime = currentTime;
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  stop(): void {
    this.sources.forEach(voice => {
      try { voice.source.stop(); } catch {}
      try { voice.gain.disconnect(); } catch {}
    });
    this.sources.clear();
    this.lastSyncTime = -1;
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  dispose(): void {
    this.stop();
    this.buffers.clear();
    this.voiceOverBuffers.clear();
    this.loadedUrls.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
  }
}

export const audioEngine = new AudioEngine();
